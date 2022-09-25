const { Binary } = require('binary-install');
const os = require('node:os');

function getPlatform() {
  const type = os.type();
  const arch = os.arch();

  if (type === 'Windows_NT' && arch === 'x64') return 'win-x64';
  if (type === 'Linux' && arch === 'x64') return 'linux-x64';
  if (type === 'Linux' && arch === 'arm64') return 'linux-arm64';
  if (type === 'Darwin' && arch === 'x64') return 'darwin-x64';
  if (type === 'Darwin' && arch === 'arm64') return 'darwin-arm64';

  throw new Error(`Unsupported platform: ${type} ${arch}`);
}

function getBinary() {
  // Prevent exiting with code 1
  process.exit = () => {};

  const platform = getPlatform();
  const { version } = require('../package.json');
  const url = `https://github.com/lagonapp/lagon/releases/download/v${version}/lagon-${platform}.tar.gz`;
  const name = 'lagon';
  return new Binary(name, url);
}

module.exports = getBinary;
