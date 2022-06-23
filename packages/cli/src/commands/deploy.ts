import fs from 'node:fs';
import path from 'node:path';
import { bundleFunction, getDeploymentConfig } from '../utils/deployments';
import { logDebug, logError, logInfo, logSuccess } from '../utils/logger';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import { API_URL, SUPPORTED_EXTENSIONS } from '../utils/constants';
import { authToken } from '../auth';

export async function deploy({ file, prod }: { file: string; prod: boolean }) {
  const fileToDeploy = path.join(process.cwd(), file);

  if (!fs.existsSync(fileToDeploy) || fs.statSync(fileToDeploy).isDirectory()) {
    logError(`File ${fileToDeploy} does not exist.`);
    return;
  }

  const extension = path.extname(fileToDeploy);

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    logError(`Extension ${extension} is not supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    return;
  }

  const config = getDeploymentConfig(fileToDeploy);

  if (!config) {
    logDebug('No deployment config found...');

    const { confirm } = await inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: `Set up and deploy ${file}?`,
    });

    if (!confirm) {
      logInfo('Deployment cancelled.');
      return;
    }

    const { name, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the function?',
      },
      {
        type: 'input',
        name: 'description',
        message: 'What is the description of the function?',
        default: '',
      },
    ]);

    logDebug(`Creating function ${name}...`);

    const code = await bundleFunction(fileToDeploy);
    const response = await fetch(`${API_URL}/organizations/cl3ssm9ai2428qemlfww9on2t/functions`, {
      method: 'POST',
      headers: {
        'x-lagon-token': authToken,
      },
      body: JSON.stringify({
        name,
        domains: [],
        memory: 128,
        timeout: 50,
        env: [],
        code,
      }),
    });

    const func = await response.json();
    console.log(func);

    logSuccess(`Function ${name} created.`);
  }
}
