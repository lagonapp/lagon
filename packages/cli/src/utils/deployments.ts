import fs from 'node:fs';
import { build } from 'esbuild';
import path from 'node:path';
import { authToken } from '../auth';
import { trpc } from '../trpc';
import { logInfo } from './logger';
import { API_URL } from './constants';
import fetch, { FormData, File } from 'node-fetch';

const CONFIG_DIRECTORY = path.join(process.cwd(), '.lagon');

export type DeploymentConfig = {
  functionId: string;
  organizationId: string;
  publicDir: string;
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

export async function bundleFunction({
  file,
  clientFile,
  assetsDir,
}: {
  file: string;
  clientFile?: string;
  assetsDir: string;
}): Promise<{ code: string; assets: { name: string; content: string }[] }> {
  const assets: { name: string; content: string }[] = [];

  logInfo('Bundling function handler...');

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
    platform: 'browser',
    // TODO: minify identifiers
    // Can't minify identifiers yet because `masterHandler` in runtime
    // needs to call a `handler` function.
    // TODO: not working with react, find why
    // minifyWhitespace: true,
    minifySyntax: true,
  });

  if (clientFile) {
    logInfo(`Bundling client file...`);

    const { outputFiles: clientOutputFiles } = await build({
      entryPoints: [clientFile],
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

    assets.push({
      name: `${path.basename(clientFile).toLowerCase()}.js`,
      content: clientOutputFiles[0].text,
    });
  }

  if (fs.existsSync(assetsDir) && fs.statSync(assetsDir).isDirectory()) {
    logInfo(`Found public directory (${path.basename(assetsDir)}), bundling assets...`);

    const getAssets = (directory: string, root?: string): { name: string; content: string }[] => {
      const assets = [];
      const files = fs.readdirSync(directory);

      for (const file of files) {
        const filePath = path.join(directory, file);

        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, 'utf8');

          assets.push({
            name: root ? root + '/' + file : file,
            content,
          });
        } else {
          assets.push(...getAssets(filePath, root ? root + '/' + file : file));
        }
      }

      return assets;
    };

    assets.push(...getAssets(assetsDir));
  } else {
    logInfo('No public directory found, skipping...');
  }

  return {
    code: outputFiles[0].text,
    assets,
  };
}

export async function createDeployment({
  functionId,
  file,
  clientFile,
  assetsDir,
}: {
  functionId: string;
  file: string;
  clientFile?: string;
  assetsDir: string;
}): Promise<{ functionName: string }> {
  const { code, assets } = await bundleFunction({ file, clientFile, assetsDir });
  const body = new FormData();

  body.set('functionId', functionId);
  body.set('code', new File([code], 'index.js'));

  for (const asset of assets) {
    body.append('assets', new File([asset.content], asset.name));
  }

  logInfo('Uploading files...');
  const response = await fetch(`${API_URL}/deployment`, {
    method: 'POST',
    headers: { 'x-lagon-token': authToken },
    body,
  });

  return (await response.json()) as { functionName: string };
}

export async function createFunction({
  name,
  file,
  clientFile,
  assetsDir,
}: {
  name: string;
  file: string;
  clientFile?: string;
  assetsDir: string;
}) {
  const { code, assets } = await bundleFunction({ file, clientFile, assetsDir });
  const func = await trpc(authToken).mutation('functions.create', {
    name,
    domains: [],
    env: [],
    cron: null,
  });

  const body = new FormData();

  body.set('functionId', func.id);
  body.set('code', new File([code], 'index.js'));

  for (const asset of assets) {
    body.append('assets', new File([asset.content], asset.name));
  }

  logInfo('Uploading files...');
  await fetch(`${API_URL}/deployment`, {
    method: 'POST',
    headers: { 'x-lagon-token': authToken },
    body,
  });

  return func;
}

export async function deleteFunction(functionId: string) {
  await trpc(authToken).mutation('functions.delete', {
    functionId,
  });
}
