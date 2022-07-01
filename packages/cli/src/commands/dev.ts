import path from 'node:path';
import fs from 'node:fs';
import { logError, logInfo } from '../utils/logger';
import { SUPPORTED_EXTENSIONS } from '../utils/constants';
import { createServer } from 'node:http';
import { clearCache, getIsolate, HandlerRequest } from '@lagon/runtime';
import Fastify from 'fastify';

const fastify = Fastify({
  logger: false,
});

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

export async function dev(file: string) {
  const fileToDeploy = path.join(process.cwd(), file);

  if (!fs.existsSync(fileToDeploy) || fs.statSync(fileToDeploy).isDirectory()) {
    logError(`File '${fileToDeploy}' does not exist.`);
    return;
  }

  const extension = path.extname(fileToDeploy);

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    logError(`Extension '${extension}' is not supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    return;
  }

  const getDeployment = () => ({
    deploymentId: 'deploymentId',
    functionId: 'functionId',
    functionName: 'functionName',
    isCurrent: true,
    memory: 128,
    timeout: 50,
    // TODO: env
    env: {},
    domains: [],
    assets: [],
  });

  fastify.all('/*', async (request, reply) => {
    if (request.url === '/favicon.ico') {
      reply.code(204);
      return;
    }

    const deployment = getDeployment();
    const asset = deployment.assets.find(asset => request.url === `/${asset}`);

    if (asset) {
      const extension = path.extname(asset) as keyof typeof extensionToContentType;

      // TODO
      // reply
      //   .status(200)
      //   .header('Content-Type', extensionToContentType[extension] || 'text/html')
      //   .send(getAssetContent(deployment, asset));
      return;
    }

    try {
      const runIsolate = await getIsolate({
        deployment,
        getDeploymentCode: async () => `export function handler() {
          return new Response("hello from isolate!")
        }`,
        onDeploymentLog: ({ log }) => {
          console.log(log.level, log.content);
        },
      });

      const handlerRequest: HandlerRequest = {
        input: request.url,
        options: {
          method: request.method,
          headers: request.headers,
          body: request.body as string,
        },
      };

      const { response } = await runIsolate(handlerRequest);

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
    } catch (error) {
      reply.status(500).header('Content-Type', 'text/html').send();

      console.log(`An error occured while running the function: ${(error as Error).message}`);
    }

    clearCache(deployment);
  });

  fastify.listen(1234, 'localhost', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Lagon is listening on ${address}`);
  });
}
