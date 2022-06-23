import { deleteAuthFile, isLoggedIn } from '../auth';
import { logError, logSuccess } from '../utils/logger';

export async function logout() {
  if (!isLoggedIn) {
    logError('You are not logged in.');
    return;
  }

  deleteAuthFile();

  logSuccess('You have been logged out.');
}
