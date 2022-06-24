import chalk from 'chalk';

export function logError(message: string) {
  console.log(`${chalk.bgRed(' ERROR ')} ${message}`);
}

export function logWarn(message: string) {
  console.log(`${chalk.bgYellow(' WARN ')} ${message}`);
}

export function logSuccess(message: string) {
  console.log(`${chalk.bgGreen(' SUCCESS ')} ${message}`);
}

export function logDebug(message: string) {
  console.log(chalk.gray(message));
}

export function logInfo(message: string) {
  console.log(message);
}
