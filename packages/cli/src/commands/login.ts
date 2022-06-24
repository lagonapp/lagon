import { deleteAuthFile, isLoggedIn, setAuthFile } from '../auth';
import open from 'open';
import inquirer from 'inquirer';
import { API_URL, SITE_URL } from '../utils/constants';
import { logDebug, logError, logSuccess } from '../utils/logger';
import fetch from 'node-fetch';

export async function login() {
  if (isLoggedIn) {
    const answers = await inquirer.prompt({
      type: 'confirm',
      name: 'logout',
      message: 'You are already logged in. Do you want to log out?',
    });

    if (answers.logout) {
      deleteAuthFile();
    }
  }

  logDebug('Opening browser to login...');

  await open(`${SITE_URL}/cli`);

  const answers = await inquirer.prompt({
    type: 'input',
    name: 'code',
    message: 'Please paste the verification code from the browser below:',
  });

  const { code } = answers;

  const response = await fetch(`${API_URL}/cli/authenticate`, {
    method: 'POST',
    body: JSON.stringify({
      code,
    }),
  });

  const json = (await response.json()) as
    | {
        token: string;
      }
    | {
        error: string;
      };

  if (json.error) {
    logError(json.error);
    return;
  }

  const { token } = json;

  setAuthFile(token);
  logSuccess('Logged in successfully. You can now clone the browser tab.');
}
