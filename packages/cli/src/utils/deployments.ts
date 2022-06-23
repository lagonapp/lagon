import fs from 'node:fs';
import { transform } from 'esbuild';
import path from 'node:path';

export type DeploymentConfig = {
  functionId: string;
};

export function getDeploymentConfig(directory: string): DeploymentConfig | undefined {
  const configPath = path.join(directory, '.lagon');

  if (!fs.existsSync(configPath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
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
