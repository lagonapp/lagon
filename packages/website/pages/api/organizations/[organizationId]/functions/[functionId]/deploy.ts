import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';
import { createDeployment, removeCurrentDeployment, removeDeployment, setCurrentDeployment } from 'lib/api/deployments';

export type CreateDeploymentResponse = {
  functionId: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
};

export type SetCurrentDeploymentResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
};

export type RemoveDeploymentResponse = CreateDeploymentResponse;

const post = async (request: NextApiRequest, response: NextApiResponse<CreateDeploymentResponse>) => {
  const functionId = request.query.functionId as string;

  const { code } = JSON.parse(request.body) as {
    code: string;
  };

  const func = await prisma.function.findFirst({
    where: {
      id: functionId,
    },
    select: {
      id: true,
      name: true,
      domains: true,
      memory: true,
      timeout: true,
      env: true,
    },
  });

  await removeCurrentDeployment(func.id);

  const deployment = await createDeployment(func, code);

  response.json(deployment);
};

const patch = async (request: NextApiRequest, response: NextApiResponse<SetCurrentDeploymentResponse>) => {
  const functionId = request.query.functionId as string;
  const deploymentId = request.query.deploymentId as string;

  const deployment = await setCurrentDeployment(functionId, deploymentId);

  response.json(deployment);
};

const del = async (request: NextApiRequest, response: NextApiResponse<RemoveDeploymentResponse>) => {
  const functionId = request.query.functionId as string;
  const deploymentId = request.query.deploymentId as string;

  const func = await prisma.function.findFirst({
    where: {
      id: functionId,
    },
    select: {
      id: true,
      name: true,
      domains: true,
      memory: true,
      timeout: true,
      env: true,
    },
  });

  const deployment = await removeDeployment(func, deploymentId);

  response.json(deployment);
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'POST':
      return post(request, response);
    case 'PATCH':
      return patch(request, response);
    case 'DELETE':
      return del(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
