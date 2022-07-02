import path from 'node:path';
import fs from 'node:fs';
import { logError, logInfo } from './logger';
import { SUPPORTED_EXTENSIONS } from './constants';

export function getFileToDeploy(file: string): string | undefined {
  const fileToDeploy = path.join(process.cwd(), file);

  if (!fs.existsSync(fileToDeploy) || fs.statSync(fileToDeploy).isDirectory()) {
    logError(`File '${fileToDeploy}' does not exists/is not a file.`);
    return;
  }

  const extension = path.extname(fileToDeploy);

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    logError(`Extension '${extension}' is not supported (${SUPPORTED_EXTENSIONS.join(', ')})`);
    return;
  }

  return fileToDeploy;
}

export function getAssetsDir(fileToDeploy: string, publicDir: string): string | undefined {
  const assetsDir = path.join(path.parse(fileToDeploy).dir, publicDir);

  if ((!fs.existsSync(assetsDir) || !fs.statSync(assetsDir).isDirectory()) && publicDir !== 'public') {
    logError(`Public directory '${publicDir}' does not exist.`);
    return;
  }

  return assetsDir;
}

export function getEnvironmentVariables(fileToDeploy: string): Record<string, string> {
  const envFile = path.join(path.parse(fileToDeploy).dir, '.env');

  if (!fs.existsSync(envFile)) {
    logInfo('Not .env file found, skipping...');
    return {};
  }

  const content = fs.readFileSync(envFile, 'utf-8');

  return content.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');

    if (key && value) {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, string>);
}
