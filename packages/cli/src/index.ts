import { checkLoggedIn, isLoggedIn } from './auth';
import { runCli } from './cli';
import { logError, logWarn } from './utils/logger';

function main() {
  try {
    checkLoggedIn();

    if (!isLoggedIn) {
      logWarn('You are not logged in. Run `lagon login` to log in.');
    }

    runCli();
  } catch (error) {
    logError((error as Error).message);
  }
}

main();
