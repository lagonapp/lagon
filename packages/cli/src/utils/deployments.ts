import fs from 'node:fs';
import { transform } from 'esbuild';
import path from 'node:path';
import { authToken } from '../auth';
import { API_URL } from './constants';
import fetch from 'node-fetch';

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

export async function bundleFunction(file: string): Promise<string> {
  const code = fs.readFileSync(file, 'utf-8');

  const { code: finalCode } = await transform(code, {
    loader: 'tsx',
    format: 'esm',
    target: 'es2020',
    // TODO: minify identifiers
    // Can't minify identifiers yet because `masterHandler` in runtime
    // needs to call a `handler` function.
    minifyWhitespace: true,
    minifySyntax: true,
  });

  return finalCode;
}

export async function createDeployment(functionId: string, organizationId: string, file: string) {
  const code = await bundleFunction(file);
  await fetch(`${API_URL}/organizations/${organizationId}/functions/${functionId}/deploy`, {
    method: 'POST',
    headers: {
      'x-lagon-token': authToken,
    },
    body: JSON.stringify({
      code,
      shouldTransformCode: false,
    }),
  });
}

export async function createFunction(name: string, organizationId: string, file: string) {
  const code = await bundleFunction(file);
  const func = (await fetch(`${API_URL}/organizations/${organizationId}/functions`, {
    method: 'POST',
    headers: {
      'x-lagon-token': authToken,
    },
    body: JSON.stringify({
      name,
      domains: [],
      env: [],
      code,
      shouldTransformCode: false,
    }),
  }).then(response => response.json())) as { id: string };

  return func;
}
