import { createRequire } from 'node:module';
import { Binary } from 'binary-install';
import os from 'node:os';

function getPlatform() {
  const type = os.type();
  const arch = os.arch();

  if (type === 'Windows_NT') {
    return {
      platform: 'lagon-win-x64',
      name: 'lagon.exe',
    };
  }

  if (type === 'Linux' && arch === 'x64') {
    return {
      platform: 'lagon-linux-x64',
      name: 'lagon',
    };
  }

  if (type === 'Linux' && arch === 'arm64') {
    return {
      platform: 'lagon-linux-arm64',
      name: 'lagon',
    };
  }

  if (type === 'Darwin' && arch === 'x64') {
    return {
      platform: 'lagon-darwin-x64',
      name: 'lagon',
    };
  }

  if (type === 'Darwin' && arch === 'arm64') {
    return {
      platform: 'lagon-darwin-arm64',
      name: 'lagon',
    };
  }

  throw new Error(`Unsupported platform: ${type} ${arch}`);
}

export function getBinary() {
  const { platform, name } = getPlatform();
  const customRequire = createRequire(import.meta.url);

  const { name: packageName, version } = customRequire('../package.json');

  const url = `https://github.com/lagonapp/lagon/releases/download/${packageName}@${version}/${platform}.tar.gz`;

  return new Binary(name, url);
}
