// All credit goes to Cloudflare wrangler-legacy and
// the initial binary-install package, which this code
// is heavily based on.
//
// Cloudflare wrangler-legacy: https://github.com/cloudflare/wrangler-legacy/blob/master/npm/binary-install.js
// binary-install: https://github.com/EverlastingBugstopper/binary-install#readme
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import axios from 'axios';
import tar from 'tar';
import { rimraf } from 'rimraf';

const error = msg => {
  console.error(msg);
  process.exit(1);
};

export class Binary {
  constructor(url, data) {
    this.url = url;
    this.name = data.name || -1;
    this.installDirectory = data.installDirectory;
    this.binaryDirectory = -1;
    this.binaryPath = -1;
  }

  _getInstallDirectory() {
    if (!existsSync(this.installDirectory)) {
      mkdirSync(this.installDirectory, { recursive: true });
    }
    return this.installDirectory;
  }

  _getBinaryDirectory() {
    const installDirectory = this._getInstallDirectory();
    const binaryDirectory = join(installDirectory, 'bin');
    if (existsSync(binaryDirectory)) {
      this.binaryDirectory = binaryDirectory;
    } else {
      error(`You have not installed ${this.name}`);
    }
    return this.binaryDirectory;
  }

  _getBinaryPath() {
    if (this.binaryPath === -1) {
      const binaryDirectory = this._getBinaryDirectory();
      this.binaryPath = join(binaryDirectory, this.name);
    }

    return this.binaryPath;
  }

  install() {
    const dir = this._getInstallDirectory();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.binaryDirectory = join(dir, 'bin');

    if (existsSync(this.binaryDirectory)) {
      rimraf.sync(this.binaryDirectory);
    }

    mkdirSync(this.binaryDirectory, { recursive: true });

    console.log(`Downloading release from ${this.url}`);

    return axios({ url: this.url, responseType: 'stream' })
      .then(res => {
        const writer = tar.x({ strip: 1, C: this.binaryDirectory });

        return new Promise((resolve, reject) => {
          res.data.pipe(writer);
          let error = null;
          writer.on('error', err => {
            error = err;
            reject(err);
          });
          writer.on('close', () => {
            if (!error) {
              resolve(true);
            }
          });
        });
      })
      .then(() => {
        console.log(`${this.name} has been installed!`);
      })
      .catch(e => {
        error(`Error fetching release: ${e.message}`);
      });
  }

  uninstall() {
    if (existsSync(this._getInstallDirectory())) {
      rimraf.sync(this.installDirectory);
      console.log(`${this.name} has been uninstalled`);
    }
  }

  run() {
    const binaryPath = this._getBinaryPath();
    const [, , ...args] = process.argv;

    const options = { cwd: process.cwd(), stdio: 'inherit' };

    const result = spawnSync(binaryPath, args, options);

    if (result.error) {
      error(result.error);
    }

    process.exit(result.status);
  }
}
