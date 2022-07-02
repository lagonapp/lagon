import path from 'node:path';
import fs from 'node:fs';
import { logInfo, logError, logSuccess, logSpace } from '../utils/logger';
import { clearCache, Deployment, getIsolate, HandlerRequest } from '@lagon/runtime';
import Fastify from 'fastify';
import { bundleFunction } from '../utils/deployments';
import chalk from 'chalk';
import { getAssetsDir, getEnvironmentVariables, getFileToDeploy } from '../utils';

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

export async function dev(file: string, { preact, publicDir }: { preact: boolean; publicDir: string }) {
  const fileToDeploy = getFileToDeploy(file);

  if (!fileToDeploy) {
    return;
  }

  const assetsDir = getAssetsDir(fileToDeploy, publicDir);

  if (!assetsDir) {
    return;
  }

  let { code, assets } = await bundleFunction(fileToDeploy, preact, assetsDir);

  const watcher = fs.watch(path.parse(fileToDeploy).dir, async eventType => {
    if (eventType === 'change') {
      console.clear();
      logInfo('Detected change, recompiling...');

      const { code: newCode, assets: newAssets } = await bundleFunction(fileToDeploy, preact, assetsDir);
      code = newCode;
      assets = newAssets;

      logSpace();
      logSuccess('Done!');
      logSpace();
    }
  });

  const deployment: Deployment = {
    deploymentId: 'deploymentId',
    functionId: 'functionId',
    functionName: 'functionName',
    isCurrent: true,
    memory: 128,
    timeout: 50,
    env: getEnvironmentVariables(fileToDeploy),
    domains: [],
    assets: assets.map(({ name }) => name),
  };

  process.on('SIGINT', () => {
    watcher.close();
    clearCache(deployment);

    process.exit();
  });

  fastify.all('/*', async (request, reply) => {
    if (request.url === '/favicon.ico') {
      reply.code(204);
      return;
    }

    const dateFormatter = Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    console.log(chalk.gray(dateFormatter.format(new Date())) + ' ' + chalk.blue(request.method) + ' ' + request.url);

    const asset = deployment.assets.find(asset => request.url === `/${asset}`);

    if (asset) {
      const extension = path.extname(asset) as keyof typeof extensionToContentType;
      console.log(chalk.black(`            Found asset: ${asset}`));

      reply
        .status(200)
        .header('Content-Type', extensionToContentType[extension] || 'text/html')
        .send(assets.find(({ name }) => name === asset)?.content);
      return;
    }

    try {
      const runIsolate = await getIsolate({
        deployment,
        getDeploymentCode: async () => code,
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

      logError(`An error occured while running the function: ${(error as Error).message}`);
    }

    clearCache(deployment);
  });

  fastify.listen(1234, 'localhost', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.clear();
    logSpace();
    logSuccess(`Dev server running at: ${address}`);
    logSpace();
  });
}
