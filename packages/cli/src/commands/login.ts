import { authToken, isLoggedIn, setAuthFile } from '../auth';
import open from 'open';
import inquirer from 'inquirer';
import { SITE_URL } from '../utils/constants';
import { logInfo, logError, logSuccess, logSpace } from '../utils/logger';
import { trpc } from '../trpc';

export async function login() {
  if (isLoggedIn) {
    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'You are already logged in. Are you sure you want to log in again?',
    });

    if (!confirm) {
      logError('Login aborted.');
      return;
    }
  }

  logSpace();
  logInfo('Opening browser...');

  await open(`${SITE_URL}/cli`);

  logInfo('Please copy and paste the verification code from the browser.');
  logSpace();

  const { code } = await inquirer.prompt({
    type: 'input',
    name: 'code',
    message: 'Verification code:',
  });

  const auth = await trpc(authToken).mutation('tokens.authenticate', { code });

  if (auth.error) {
    logError(auth.error);
    return;
  }

  const { token } = auth;

  setAuthFile(token as string);
  logSpace();
  logSuccess('You can now close the browser tab.');
}
