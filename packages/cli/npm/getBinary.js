const { Binary } = require('binary-install');
const os = require('node:os');

function getPlatform() {
  const type = os.type();
  const arch = os.arch();

  if (type === 'Windows_NT') return 'win-x64';
  if (type === 'Linux' && arch === 'x64') return 'linux-x64';
  if (type === 'Linux' && arch === 'arm64') return 'linux-arm64';
  if (type === 'Darwin') return 'darwin-x64';

  throw new Error(`Unsupported platform: ${type} ${arch}`);
}

function getBinary() {
  // Prevent exiting with code 1
  process.exit = () => {};

  const platform = getPlatform();
  const { version } = require('../package.json');
  // %40lagon%2Fcli%40 translates to @lagon/cli@
  const url = `https://github.com/lagonapp/lagon/releases/download/%40lagon%2Fcli%40${version}/lagon-${platform}.tar.gz`;
  const name = 'lagon';
  return new Binary(name, url);
}

module.exports = getBinary;
