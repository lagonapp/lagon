import fs from 'node:fs';
import path from 'node:path';
import { deleteFunction, getDeploymentConfig, removeDeploymentFile } from '../utils/deployments';
import { logError, logSpace, logSuccess } from '../utils/logger';
import inquirer from 'inquirer';

export async function undeploy(file: string) {
  const fileToDeploy = path.join(process.cwd(), file);

  if (!fs.existsSync(fileToDeploy) || fs.statSync(fileToDeploy).isDirectory()) {
    logError(`File ${fileToDeploy} does not exists/is not a file.`);
    return;
  }

  const config = getDeploymentConfig(fileToDeploy);

  if (!config) {
    logError(`No deployment found for ${file}.`);
    return;
  }

  const { confirm } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: 'Are you sure you want to completely delete this function?',
  });

  if (!confirm) {
    logError('Removal aborted.');
    return;
  }

  await deleteFunction(config.functionId);
  removeDeploymentFile(fileToDeploy);

  logSpace();
  logSuccess('Function deleted.');
}
