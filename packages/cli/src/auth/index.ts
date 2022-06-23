import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const AUTH_FILE = path.join(os.homedir(), '.lagon', 'auth');
const KEY = 'token';

export let authToken = '';
export let isLoggedIn = false;

export function deleteAuthFile() {
  fs.rmSync(AUTH_FILE);
}

export function setAuthFile(token: string) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, `${KEY}=${token}`);
}

export function checkLoggedIn() {
  if (!fs.existsSync(AUTH_FILE)) {
    return;
  }

  const content = fs.readFileSync(AUTH_FILE, 'utf8');
  const [key, token] = content.split('=');

  if (!key || key !== KEY || !token) {
    deleteAuthFile();

    throw new Error('Auth file is invalid. Please log in again.');
  }

  authToken = token;
  isLoggedIn = true;
}

// export function warnIfNotLoggedIn() {
//   logWarn('You are not logged in. Run `lagon login` to log in.');
// }
