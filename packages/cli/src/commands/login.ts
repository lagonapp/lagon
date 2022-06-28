import { authToken, isLoggedIn, setAuthFile } from '../auth';
import open from 'open';
import inquirer from 'inquirer';
import { SITE_URL } from '../utils/constants';
import { logDebug, logError, logSuccess } from '../utils/logger';
import { trpc } from '../trpc';

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

  const auth = await trpc(authToken).mutation('tokens.authenticate', { code });

  if (auth.error) {
    logError(auth.error);
    return;
  }

  const { token } = auth;

  setAuthFile(token);
  logSuccess('Logged in successfully. You can now clone the browser tab.');
}
