import { getBytesFromReply, getBytesFromRequest, getDeploymentFromRequest } from 'src/deployments/config';
import { addDeploymentResult, calculateIsolateResources } from 'src/deployments/result';
import Fastify from 'fastify';
import { DeploymentResult, HandlerRequest, addLog, OnDeploymentLog, DeploymentLog, getIsolate } from '@lagon/runtime';
import { getDeploymentCode } from 'src/deployments';
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

const html404 = fs.readFileSync(path.join(path.resolve(), 'public', '404.html'), 'utf8');
const html500 = fs.readFileSync(path.join(path.resolve(), 'public', '500.html'), 'utf8');
const css = fs.readFileSync(path.join(path.resolve(), 'public', 'main.css'), 'utf8');

const logs = new Map<string, DeploymentLog[]>();

const onDeploymentLog: OnDeploymentLog = ({ deploymentId, log }) => {
  if (!logs.has(deploymentId)) {
    logs.set(deploymentId, []);
  }

  logs.get(deploymentId)?.push(log);
};

export default function startServer(port: number, host: string) {
  fastify.all('/*', async (request, reply) => {
    console.time('Request');

    if (request.url === '/favicon.ico') {
      reply.code(204);

      console.timeEnd('Request');
      return;
    }

    if (request.url === '/main.css') {
      reply.header('Content-Type', 'text/css').send(css);

      console.timeEnd('Request');
      return;
    }

    const deployment = getDeploymentFromRequest(request);

    if (!deployment) {
      reply.status(404).header('Content-Type', 'text/html').send(html404);

      console.timeEnd('Request');
      return;
    }

    const deploymentResult: DeploymentResult = {
      cpuTime: BigInt(0),
      memory: 0,
      receivedBytes: getBytesFromRequest(request),
      sentBytes: 0,
      logs: [],
    };

    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode,
      onDeploymentLog,
    });

    let isolateCache: Isolate;
    let errored = false;

    try {
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

      reply
        .status(response.status || 200)
        .headers(response.headers || {})
        .send(response.body);
      console.timeEnd('Request');

      deploymentResult.sentBytes = getBytesFromReply(reply);
    } catch (error) {
      errored = true;

      const errorMessage = `An error occured while running the function: ${(error as Error).message}`;

      reply.status(500).header('Content-Type', 'text/html').send(html500);
      console.timeEnd('Request');

      console.log(errorMessage);

      addLog({ deploymentId: deployment.deploymentId, logLevel: 'error', onDeploymentLog })(errorMessage);
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
