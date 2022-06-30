import { getBytesFromReply, getBytesFromRequest, getDeploymentFromRequest } from 'src/deployments/config';
import { addDeploymentResult, calculateIsolateResources } from 'src/deployments/result';
import Fastify from 'fastify';
import { DeploymentResult, HandlerRequest, addLog, OnDeploymentLog, DeploymentLog, getIsolate } from '@lagon/runtime';
import { getAssetContent, getDeploymentCode } from 'src/deployments';
import path from 'node:path';
import fs from 'node:fs';
import type { Isolate } from 'isolated-vm';

const fastify = Fastify({
  logger: false,
});

fastify.addContentTypeParser('multipart/form-data', (request, payload, done) => {
  let data = '';

  payload.on('data', chunk => {
    data += chunk;
  });

  payload.on('end', () => {
    done(null, data);
  });
});

const html404 = fs.readFileSync(path.join(new URL('.', import.meta.url).pathname, '../public/404.html'), 'utf8');
const html500 = fs.readFileSync(path.join(new URL('.', import.meta.url).pathname, '../public/500.html'), 'utf8');

const logs = new Map<string, DeploymentLog[]>();

const onDeploymentLog: OnDeploymentLog = ({ deploymentId, log }) => {
  if (!logs.has(deploymentId)) {
    logs.set(deploymentId, []);
  }

  logs.get(deploymentId)?.push(log);
};

function getStackTrace(error: Error) {
  const stack = error.stack?.split('\n');

  if (stack) {
    return stack
      .filter(line => {
        return !(line.includes('file://') || line.includes('at masterHandler') || line.includes('.ts:'));
      })
      .join('\n');
  }

  return error.message;
}

const extensionToContentType = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.otf': 'application/font-otf',
};

export default function startServer(port: number, host: string) {
  fastify.all('/*', async (request, reply) => {
    const id = `Request ${Math.random()}`;
    console.time(id);

    if (request.url === '/favicon.ico') {
      reply.code(204);

      console.timeEnd(id);
      return;
    }

    const deployment = getDeploymentFromRequest(request);

    if (!deployment) {
      reply.status(404).header('Content-Type', 'text/html').send(html404);

      console.timeEnd(id);
      return;
    }

    const asset = deployment.assets.find(asset => request.url === `/${asset}`);

    if (asset) {
      const extension = path.extname(asset) as keyof typeof extensionToContentType;

      reply
        .status(200)
        .header('Content-Type', extensionToContentType[extension] || 'text/html')
        .send(getAssetContent(deployment, asset));

      console.timeEnd(id);
      return;
    }

    const deploymentResult: DeploymentResult = {
      cpuTime: BigInt(0),
      memory: 0,
      receivedBytes: getBytesFromRequest(request),
      sentBytes: 0,
      logs: [],
    };

    let isolateCache: Isolate;
    let errored = false;

    try {
      const runIsolate = await getIsolate({
        deployment,
        getDeploymentCode,
        onDeploymentLog,
      });

      const handlerRequest: HandlerRequest = {
        input: request.url,
        options: {
          method: request.method,
          headers: request.headers,
          body: request.body as string,
        },
      };

      const { response, isolate } = await runIsolate(handlerRequest);
      isolateCache = isolate;

      if (!response) {
        throw new Error('Function did not return a response');
      }

      const headers: Record<string, string> = {};

      for (const [key, values] of response.headers.headers.entries()) {
        headers[key] = values[0];
      }

      reply
        .status(response.status || 200)
        .headers(headers)
        .send(response.body);
      console.timeEnd(id);

      deploymentResult.sentBytes = getBytesFromReply(reply);
    } catch (error) {
      errored = true;

      reply.status(500).header('Content-Type', 'text/html').send(html500);
      console.timeEnd(id);

      console.log(`An error occured while running the function: ${(error as Error).message}`);

      addLog({ deploymentId: deployment.deploymentId, logLevel: 'error', onDeploymentLog })(
        getStackTrace(error as Error),
      );
    }

    if (!errored) {
      calculateIsolateResources({ isolate: isolateCache!, deployment, deploymentResult });
    }

    deploymentResult.logs = logs.get(deployment.deploymentId) || [];
    logs.delete(deployment.deploymentId);

    addDeploymentResult({ deployment, deploymentResult });
  });

  fastify.listen(port, host, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Lagon is listening on ${address}`);
  });
}
