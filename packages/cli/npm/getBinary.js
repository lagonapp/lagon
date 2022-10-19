const { Binary } = require('binary-install');
const os = require('node:os');

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

  if (type === 'Darwin') {
    return {
      platform: 'lagon-darwin-x64',
      name: 'lagon',
    };
  }

  throw new Error(`Unsupported platform: ${type} ${arch}`);
}

function getBinary() {
  // Prevent exiting with code 1
  process.exit = () => { };

  const { platform, name } = getPlatform();
  const { name: packageName, version } = require('../package.json');

  const url = `https://github.com/lagonapp/lagon/releases/download/${packageName}@${version}/${platform}.tar.gz`;

  return new Binary(name, url);
}

module.exports = getBinary;
