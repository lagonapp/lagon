import { isLoggedIn, setAuthFile } from '../auth';
import open from 'open';
import inquirer from 'inquirer';
import { API_URL, SITE_URL } from '../utils/constants';
import { logDebug, logError, logSuccess } from '../utils/logger';
import fetch from 'node-fetch';

export async function login() {
  if (isLoggedIn) {
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'You are already logged in. Are you sure you want to log in again?',
    });

    if (!confirm) {
      logError(`Aborted login.`);
      return;
    }
  }

  logDebug('Opening browser to login...');

  await open(`${SITE_URL}/cli`);

  const { code } = await inquirer.prompt({
    type: 'input',
    name: 'code',
    message: 'Please paste the verification code from the browser:',
  });

  const response = await fetch(`${API_URL}/cli/authenticate`, {
    method: 'POST',
    body: JSON.stringify({
      code,
    }),
  });

  const json = (await response.json()) as {
    token: string;
    error?: string;
  };

  if (json.error) {
    logError(json.error);
    return;
  }

  const { token } = json;

  setAuthFile(token);
  logSuccess('Logged in successfully. You can now clone the browser tab.');
}
