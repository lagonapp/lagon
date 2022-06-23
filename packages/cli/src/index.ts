import { checkLoggedIn } from './auth';
import { runCli } from './cli';
import { logError } from './utils/logger';

function main() {
  try {
    checkLoggedIn();

    runCli();
  } catch (error) {
    logError((error as Error).message);
  }
}

main();
