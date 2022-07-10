import fs from 'node:fs';
import ivm from 'isolated-vm';
import { Deployment } from '../deployments';
import { addLog, OnDeploymentLog } from '../deployments/log';
import { fetch, FetchResult } from '../fetch';
import { RequestInit } from '../runtime/Request';
import path from 'node:path';

async function mockEnvironmentVariables({ deployment, context }: { deployment: Deployment; context: ivm.Context }) {
  let environmentVariables = 'global.process = { env: { NODE_ENV: "production" } }\n';

  for (const [key, value] of Object.entries(deployment.env)) {
    environmentVariables += `global.process.env.${key.toUpperCase()} = "${value}"\n`;
  }

  context.eval(environmentVariables);
}

function mockFunction(context: ivm.Context) {
  context.eval(`const initialFunction = global.Function
global.Function = function() {
  throw new Error('Function is not a function')
}`);
}

function mockConsole({
  deployment: { deploymentId },
  context,
  onDeploymentLog,
}: {
  deployment: Deployment;
  context: ivm.Context;
  onDeploymentLog?: OnDeploymentLog;
}) {
  const consoleMock = {
    log: addLog({ deploymentId, onDeploymentLog, logLevel: 'log' }),
    error: addLog({ deploymentId, onDeploymentLog, logLevel: 'error' }),
    info: addLog({ deploymentId, onDeploymentLog, logLevel: 'info' }),
    warn: addLog({ deploymentId, onDeploymentLog, logLevel: 'warn' }),
    debug: addLog({ deploymentId, onDeploymentLog, logLevel: 'debug' }),
  };

  for (const [key, value] of Object.entries(consoleMock)) {
    context.evalClosureSync(
      `global.console.${key} = function(...args) {
          $0.applyIgnored(undefined, args, { arguments: { copy: true } });
      }`,
      [value],
      { arguments: { reference: true } },
    );
  }
}

async function mockFetch(context: ivm.Context) {
  const { code, filename } = readRuntimeFile('fetch');
  await context.evalClosure(
    code,
    [
      async (resource: string, init?: RequestInit): Promise<FetchResult> => {
        return fetch(resource, init);
      },
    ],
    { result: { promise: true, reference: true }, arguments: { reference: true }, filename },
  );
}

export const snapshot = ivm.Isolate.createSnapshot([
  readRuntimeFile('Response', code => code.replace(/global.*;/gm, '')),
  readRuntimeFile('Request', code => code.replace(/global.*;/gm, '')),
  readRuntimeFile('parseMultipart'),
  readRuntimeFile('URL'),
  readRuntimeFile('encoding'),
  readRuntimeFile('base64'),
]);

function readRuntimeFile(filename: string, transform?: (code: string) => string) {
  const code = fs
    .readFileSync(
      /* c8 ignore start */
      process.env.NODE_ENV === 'test'
        ? path.join(process.cwd(), 'packages/runtime/dist/runtime', `${filename}.js`)
        : new URL(`runtime/${filename}.js`, import.meta.url),
      /* c8 ignore end */
    )
    .toString('utf-8')
    .replace(/export((.|\n)*);/gm, '');

  return {
    filename: `file:///${filename.toLowerCase()}.js`,
    code: transform?.(code) || code,
  };
}

export async function initRuntime({
  deployment,
  context,
  onDeploymentLog,
}: {
  deployment: Deployment;
  context: ivm.Context;
  onDeploymentLog?: OnDeploymentLog;
}) {
  await context.global.set('global', context.global.derefInto());
  await context.global.set('eval', undefined);

  await Promise.all([
    mockEnvironmentVariables({ deployment, context }),
    mockFunction(context),
    mockConsole({ deployment, context, onDeploymentLog }),
    mockFetch(context),
  ]);
}
