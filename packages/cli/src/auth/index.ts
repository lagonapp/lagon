import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const AUTH_FILE = path.join(os.homedir(), '.lagon', 'auth');
const KEY = 'token';

export let isLoggedIn = false;

export function checkLoggedIn() {
  if (!fs.existsSync(AUTH_FILE)) {
    return;
  }

  const content = fs.readFileSync(AUTH_FILE, 'utf8');
  const [key, token] = content.split('=');

  if (!key || key !== KEY || !token) {
    fs.rmSync(AUTH_FILE);

    throw new Error('Auth file is invalid. Please log in again.');
  }

  isLoggedIn = true;
}
