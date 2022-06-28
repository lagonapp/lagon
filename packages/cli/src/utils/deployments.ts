import fs from 'node:fs';
import { build } from 'esbuild';
import path from 'node:path';
import { authToken } from '../auth';
import { trpc } from '../trpc';

const CONFIG_DIRECTORY = path.join(process.cwd(), '.lagon');

export type DeploymentConfig = {
  functionId: string;
  organizationId: string;
};

export function getDeploymentConfig(file: string): DeploymentConfig | undefined {
  if (!fs.existsSync(CONFIG_DIRECTORY)) {
    return undefined;
  }

  const configFile = path.join(CONFIG_DIRECTORY, path.basename(file) + '.json');

  if (!fs.existsSync(configFile)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(configFile, 'utf8'));
}

export function writeDeploymentConfig(file: string, deploymentConfig: DeploymentConfig) {
  if (!fs.existsSync(CONFIG_DIRECTORY)) {
    fs.mkdirSync(CONFIG_DIRECTORY);
  }

  const configFile = path.join(CONFIG_DIRECTORY, path.basename(file) + '.json');

  fs.writeFileSync(configFile, JSON.stringify(deploymentConfig));
}

export function removeDeploymentFile(file: string) {
  const configFile = path.join(CONFIG_DIRECTORY, path.basename(file) + '.json');

  fs.rmSync(configFile);
}

export async function bundleFunction(file: string): Promise<string> {
  const { outputFiles } = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
      '.js': 'js',
      '.jsx': 'jsx',
    },
    format: 'esm',
    target: 'es2020',
    // TODO: minify identifiers
    // Can't minify identifiers yet because `masterHandler` in runtime
    // needs to call a `handler` function.
    minifyWhitespace: true,
    minifySyntax: true,
  });

  return outputFiles[0].text;
}

export async function createDeployment(functionId: string, file: string) {
  const code = await bundleFunction(file);
  await trpc(authToken).mutation('deployments.create', {
    functionId,
    code,
    shouldTransformCode: false,
  });
}

export async function createFunction(name: string, file: string) {
  const code = await bundleFunction(file);
  const func = await trpc(authToken).mutation('functions.create', {
    name,
    domains: [],
    env: [],
    cron: null,
    code,
    shouldTransformCode: false,
  });

  return func;
}

export async function deleteFunction(functionId: string) {
  await trpc(authToken).mutation('functions.delete', {
    functionId,
  });
}
