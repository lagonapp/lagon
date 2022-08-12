import path from 'node:path';
import fs from 'node:fs';
import { logInfo, logError, logSuccess, logSpace, logWarn } from '../utils/logger';
import { clearCache, Deployment, getIsolate, HandlerRequest, OnReceiveStream } from '@lagon/runtime';
import Fastify from 'fastify';
import { bundleFunction } from '../utils/deployments';
import chalk from 'chalk';
import { getAssetsDir, getClientFile, getEnvironmentVariables, getFileToDeploy } from '../utils';
import { extensionToContentType, FUNCTION_DEFAULT_MEMORY, FUNCTION_DEFAULT_TIMEOUT } from '@lagon/common';
import { Readable } from 'node:stream';

const fastify = Fastify({
  logger: false,
});

const dateFormatter = Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
const getDate = () => dateFormatter.format(new Date());

const streams = new Map<string, Readable>();

const onReceiveStream: OnReceiveStream = (deployment, done, chunk) => {
  let stream = streams.get(deployment.deploymentId);

  if (!stream) {
    stream = new Readable();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    stream._read = () => {};
    streams.set(deployment.deploymentId, stream);
  }

  stream.push(done ? null : chunk);
};

export async function dev(
  file: string,
  {
    preact,
    client,
    publicDir,
    port,
    host,
  }: { preact: boolean; client: string; publicDir: string; port: string; host: string },
) {
  const fileToDeploy = getFileToDeploy(file);

  if (!fileToDeploy) {
    return;
  }

  const assetsDir = getAssetsDir(fileToDeploy, publicDir);

  if (!assetsDir) {
    return;
  }

  let clientFile: string | undefined;

  if (client || preact) {
    if (preact) {
      logWarn("'--preact' is deprecated, use '--client <file>' instead.");
    }

    clientFile = getClientFile(fileToDeploy, preact ? 'App.tsx' : client);

    if (!clientFile) {
      return;
    }
  }

  let { code, assets } = await bundleFunction({ file: fileToDeploy, clientFile, assetsDir });

  const watcher = fs.watch(path.parse(fileToDeploy).dir, async eventType => {
    if (eventType === 'change') {
      console.clear();
      logInfo('Detected change, recompiling...');

      const { code: newCode, assets: newAssets } = await bundleFunction({
        file: fileToDeploy,
        clientFile,
        assetsDir,
      });
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
    console.log(`${chalk.gray(getDate())} ${chalk.blue.bold(request.method)} ${chalk.black(request.url)}`);

    const asset = deployment.assets.find(asset => request.url === `/${asset}`);

    if (asset) {
      const extension = path.extname(asset);
      console.log(chalk.black(`            ${chalk.gray('Found asset:')} ${chalk.gray.bold(asset)}`));

      reply
        .status(200)
        .header('Content-Type', extensionToContentType(extension) || 'text/plain')
        .send(fs.createReadStream(path.join(assetsDir, asset)));
      return;
    }

    if (request.url === '/favicon.ico') {
      reply.code(204);
      return;
    }

    try {
      const runIsolate = await getIsolate({
        deployment,
        getDeploymentCode: async () => code,
        onReceiveStream,
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

          logSpace();
          console.log(`${chalk.gray(getDate())} ${color.bold(log.level)} ${chalk.black(log.content)}`);
          logSpace();
        },
      });

      const handlerRequest: HandlerRequest = {
        input: request.protocol + '://' + request.hostname + request.url,
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

      // @ts-expect-error we access `headers` which is the private map inside `Headers`
      for (const [key, values] of response.headers.headers.entries()) {
        if (values[0] instanceof Map) {
          for (const [key, value] of values[0]) {
            headers[key] = value;
          }
        }

        headers[key] = values[0];
      }

      const payload = streams.get(deployment.deploymentId) || response.body;

      if (payload instanceof Readable) {
        payload.on('end', () => {
          clearCache(deployment);
          streams.delete(deployment.deploymentId);
        });
      }

      reply
        .status(response.status || 200)
        .headers(headers)
        .send(payload);
    } catch (error) {
      reply.status(500).header('Content-Type', 'text/html').send();

      logError(`An error occured while running the function: ${(error as Error).message}`);
    }

    if (!streams.has(deployment.deploymentId)) {
      clearCache(deployment);
    }
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
