import path from 'node:path';
import fs from 'node:fs';
import { logInfo, logError, logSuccess, logSpace } from '../utils/logger';
import { clearCache, Deployment, getIsolate, HandlerRequest } from '@lagon/runtime';
import Fastify from 'fastify';
import { bundleFunction } from '../utils/deployments';
import chalk from 'chalk';
import { getAssetsDir, getEnvironmentVariables, getFileToDeploy } from '../utils';
import { extensionToContentType, FUNCTION_DEFAULT_MEMORY, FUNCTION_DEFAULT_TIMEOUT } from '@lagon/common';

const fastify = Fastify({
  logger: false,
});

const dateFormatter = Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export async function dev(
  file: string,
  { preact, publicDir, port, host }: { preact: boolean; publicDir: string; port: string; host: string },
) {
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
    memory: FUNCTION_DEFAULT_MEMORY,
    timeout: FUNCTION_DEFAULT_TIMEOUT,
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
          const color =
            log.level === 'debug'
              ? chalk.black
              : log.level === 'error'
              ? chalk.red
              : log.level === 'info'
              ? chalk.blue
              : log.level === 'log'
              ? chalk.gray
              : chalk.yellow;

          console.log(`            ${color(log.level)} ${log.content}`);
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

  // get an available port to listen.
  let retryCount = 0;
  async function start(nextPort: number) {
    try {
      const address = await fastify.listen(nextPort, host);
      console.clear();
      logSpace();
      logSuccess(`Dev server running at: ${address}`);
      logSpace();
    } catch (err: any) {
      if (err) {
        if (err.code === 'EADDRINUSE' && retryCount < 10) {
          retryCount++;
          logError(`Port ${err.port} is in use, trying ${err.port + 1} instead.`);
          await start(err.port + 1);
        } else {
          console.error(err);
          process.exit(1);
        }
      }
    }
  }

  const parsedPort = parseInt(port);
  start(isNaN(parsedPort) ? 1234 : parsedPort);
}
