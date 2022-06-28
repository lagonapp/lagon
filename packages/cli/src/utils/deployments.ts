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

export async function bundleFunction(
  file: string,
  preact: boolean,
): Promise<{ code: string; assets: { name: string; content: string }[] }> {
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
    platform: 'neutral',
    // TODO: minify identifiers
    // Can't minify identifiers yet because `masterHandler` in runtime
    // needs to call a `handler` function.
    minifyWhitespace: true,
    minifySyntax: true,
  });

  if (preact) {
    const { outputFiles: clientOutputFiles } = await build({
      entryPoints: [path.join(path.parse(file).dir, 'App.tsx')],
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
      platform: 'browser',
      // TODO: minify identifiers
      // Can't minify identifiers yet because `masterHandler` in runtime
      // needs to call a `handler` function.
      minifyWhitespace: true,
      minifySyntax: true,
    });

    return {
      code: outputFiles[0].text,
      assets: [
        {
          name: 'app.js',
          content: clientOutputFiles[0].text,
        },
      ],
    };
  }

  return {
    code: outputFiles[0].text,
    assets: [],
  };
}

export async function createDeployment(functionId: string, file: string, preact: boolean) {
  const { code, assets } = await bundleFunction(file, preact);

  await trpc(authToken).mutation('deployments.create', {
    functionId,
    code,
    assets,
    shouldTransformCode: false,
  });
}

export async function createFunction(name: string, file: string, preact: boolean) {
  const { code, assets } = await bundleFunction(file, preact);
  const func = await trpc(authToken).mutation('functions.create', {
    name,
    domains: [],
    env: [],
    cron: null,
    code,
    assets,
    shouldTransformCode: false,
  });

  return func;
}

export async function deleteFunction(functionId: string) {
  await trpc(authToken).mutation('functions.delete', {
    functionId,
  });
}
