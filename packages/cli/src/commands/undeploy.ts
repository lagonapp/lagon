import fs from 'node:fs';
import path from 'node:path';
import { deleteFunction, getDeploymentConfig, removeDeploymentFile } from '../utils/deployments';
import { logError, logSuccess } from '../utils/logger';
import inquirer from 'inquirer';

export async function undeploy(file: string) {
  const fileToDeploy = path.join(process.cwd(), file);

  if (!fs.existsSync(fileToDeploy) || fs.statSync(fileToDeploy).isDirectory()) {
    logError(`File ${fileToDeploy} does not exist.`);
    return;
  }

  const config = getDeploymentConfig(fileToDeploy);

  if (!config) {
    logError(`No deployment found for ${file}`);
    return;
  }

  const { confirm } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: "Are you sure you want to remove this function? You'll lost every deployments ands logs associated.",
  });

  if (!confirm) {
    logError(`Aborted removal of ${file}`);
    return;
  }

  deleteFunction(config.functionId, config.organizationId);
  removeDeploymentFile(fileToDeploy);
  logSuccess(`Function deleted.`);
}
