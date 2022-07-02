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

export async function bundleFunction(
  file: string,
  preact: boolean,
  assetsDir: string,
): Promise<{ code: string; assets: { name: string; content: string }[] }> {
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

  if (preact) {
    logInfo(`Bundling 'preact' code...`);

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

    assets.push({
      name: 'app.js',
      content: clientOutputFiles[0].text,
    });
  }

  if (fs.existsSync(assetsDir) && fs.statSync(assetsDir).isDirectory()) {
    logInfo(`Found 'public' directory, bundling assets...`);

    const files = fs.readdirSync(assetsDir);

    for (const file of files) {
      const filePath = path.join(assetsDir, file);

      if (fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, 'utf8');

        assets.push({
          name: file,
          content,
        });
      }
    }
  } else {
    logInfo('No public directory found, skipping...');
  }

  return {
    code: outputFiles[0].text,
    assets,
  };
}

export async function createDeployment(
  functionId: string,
  file: string,
  preact: boolean,
  assetsDir: string,
): Promise<{ functionName: string }> {
  const { code, assets } = await bundleFunction(file, preact, assetsDir);
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

  return response.json();
}

export async function createFunction(name: string, file: string, preact: boolean, assetsDir: string) {
  const { code, assets } = await bundleFunction(file, preact, assetsDir);
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
