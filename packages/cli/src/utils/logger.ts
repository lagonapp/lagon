import chalk from 'chalk';

export function logError(message: string) {
  console.log(`${chalk.red('error  ')} ${message}`);
}

export function logSuccess(message: string) {
  console.log(`${chalk.green('success')} ${message}`);
}

export function logInfo(message: string) {
  console.log(`${chalk.blueBright('info   ')} ${chalk.gray(message)}`);
}

export function logSpace() {
  console.log(' ');
}

export function logDeploymentSuccessful(createdFunction: boolean, functionName: string) {
  logSpace();
  logSuccess(createdFunction ? `Function ${functionName} created.` : 'Function deployed.');
  logSpace();
  console.log(` ➤ ${chalk.gray('https://') + chalk.blueBright(functionName) + chalk.gray('.lagon.app')}`);
  logSpace();
}
