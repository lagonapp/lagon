import path from 'node:path';
import { createDeployment, createFunction, getDeploymentConfig, writeDeploymentConfig } from '../utils/deployments';
import { logInfo, logSpace, logDeploymentSuccessful } from '../utils/logger';
import inquirer from 'inquirer';
import { authToken } from '../auth';
import { trpc } from '../trpc';
import { getAssetsDir, getFileToDeploy } from '../utils';

export async function deploy(file: string, { preact, publicDir }: { preact: boolean; publicDir: string }) {
  const fileToDeploy = getFileToDeploy(file);

  if (!fileToDeploy) {
    return;
  }

  const assetsDir = getAssetsDir(fileToDeploy, publicDir);

  if (!assetsDir) {
    return;
  }

  const config = getDeploymentConfig(fileToDeploy);

  if (!config) {
    logInfo('No deployment config found...');
    logSpace();

    const organizations = await trpc(authToken).query('organizations.list');

    const { organization } = await inquirer.prompt([
      {
        type: 'list',
        name: 'organization',
        message: 'Select the organization to deploy to',
        choices: organizations.map(({ name, id }) => ({
          name,
          value: id,
        })),
      },
    ]);

    const { link } = await inquirer.prompt({
      type: 'confirm',
      name: 'link',
      message: 'Link to an existing function?',
    });

    if (link) {
      const functions = await trpc(authToken).query('functions.list');

      const { func } = await inquirer.prompt([
        {
          type: 'list',
          name: 'func',
          message: 'Select the function to deploy',
          choices: functions.map(({ name, id }) => ({
            name,
            value: id,
          })),
        },
      ]);

      logSpace();

      const deployment = await createDeployment(func, fileToDeploy, preact, assetsDir);
      writeDeploymentConfig(fileToDeploy, { functionId: func, organizationId: organization, publicDir });
      logDeploymentSuccessful(false, deployment.functionName);
    } else {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is the name of this function?',
        },
      ]);

      logSpace();

      const func = await createFunction(name, fileToDeploy, preact, assetsDir);
      writeDeploymentConfig(fileToDeploy, { functionId: func.id, organizationId: organization, publicDir });
      logDeploymentSuccessful(true, name);
    }

    return;
  }

  let finalAssetsDir;

  if (publicDir !== 'public') {
    finalAssetsDir = assetsDir;
  } else {
    finalAssetsDir = path.join(path.parse(fileToDeploy).dir, config.publicDir);
  }

  const deployment = await createDeployment(config.functionId, fileToDeploy, preact, finalAssetsDir);
  logDeploymentSuccessful(false, deployment.functionName);
}
