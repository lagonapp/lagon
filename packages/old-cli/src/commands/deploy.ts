import path from 'node:path';
import { createDeployment, createFunction, getDeploymentConfig, writeDeploymentConfig } from '../utils/deployments';
import { logInfo, logSpace, logDeploymentSuccessful, logWarn } from '../utils/logger';
import inquirer from 'inquirer';
import { authToken } from '../auth';
import { trpc } from '../trpc';
import { getAssetsDir, getClientFile, getFileToDeploy } from '../utils';

export async function deploy(
  file: string,
  { preact, client, publicDir, force }: { preact: boolean; client: string; publicDir: string; force: boolean },
) {
  const fileToDeploy = getFileToDeploy(file);

  if (!fileToDeploy) {
    return;
  }

  const assetsDir = getAssetsDir(fileToDeploy, publicDir);

  if (!assetsDir) {
    return;
  }

  let clientFile: string | undefined;

  if (client || preact) {
    if (preact) {
      logWarn("'--preact' is deprecated, use '--client <file>' instead.");
    }

    clientFile = getClientFile(fileToDeploy, preact ? 'App.tsx' : client);

    if (!clientFile) {
      return;
    }
  }

  const config = getDeploymentConfig(fileToDeploy);

  if (!config || force) {
    if (force) {
      logWarn('Forcing a new deployment...');
    } else {
      logInfo('No deployment config found...');
    }

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

      writeDeploymentConfig(fileToDeploy, { functionId: func, organizationId: organization, publicDir });

      logSpace();

      await createDeployment({
        functionId: func,
        file: fileToDeploy,
        clientFile,
        assetsDir,
      });
    } else {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is the name of this function?',
        },
      ]);

      logSpace();

      const func = await createFunction({ name, file: fileToDeploy, clientFile, assetsDir });

      if (func) {
        writeDeploymentConfig(fileToDeploy, { functionId: func.id, organizationId: organization, publicDir });
        logDeploymentSuccessful(true, name);
      }
    }

    return;
  }

  let finalAssetsDir;

  if (publicDir !== 'public') {
    finalAssetsDir = assetsDir;
  } else {
    finalAssetsDir = path.join(path.parse(fileToDeploy).dir, config.publicDir);
  }

  await createDeployment({
    functionId: config.functionId,
    file: fileToDeploy,
    clientFile,
    assetsDir: finalAssetsDir,
  });
}
