import { checkLoggedIn } from './auth';
import { runCli } from './cli';
import { logError } from './utils/logger';
import pkg from '../package.json';
import updateNotifier from 'update-notifier';

updateNotifier({ pkg }).notify();

function main() {
  try {
    checkLoggedIn();

    runCli();
  } catch (error) {
    logError((error as Error).message);
  }
}

main();
