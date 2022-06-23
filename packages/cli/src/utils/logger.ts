import chalk from 'chalk';

export function logError(message: string) {
  console.log(`${chalk.bgRed(' ERROR ')} ${message}`);
}

export function logWarn(message: string) {
  console.log(`${chalk.bgYellow(' WARN ')} ${message}`);
}
