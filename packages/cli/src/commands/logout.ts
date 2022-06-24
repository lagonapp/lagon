import inquirer from 'inquirer';
import { deleteAuthFile, isLoggedIn } from '../auth';
import { logError, logSuccess } from '../utils/logger';

export async function logout() {
  if (!isLoggedIn) {
    logError('You are not logged in.');
    return;
  }

  const { confirm } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: 'Are you sure you want to log out?',
  });

  if (!confirm) {
    logError(`Aborted logout.`);
    return;
  }

  deleteAuthFile();

  logSuccess('You have been logged out.');
}
