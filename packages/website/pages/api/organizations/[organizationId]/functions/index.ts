import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import apiHandler from 'lib/api';
import { createDeployment } from 'lib/api/deployments';
import { DEFAULT_MEMORY, DEFAULT_TIMEOUT } from '../../../../../lib/constants';

export type GetFunctionsResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  domains: string[];
  memory: number;
  timeout: number;
  env: string[];
  cron?: string;
  deployments: {
    id: string;
    isCurrent: boolean;
    triggerer: string;
    commit?: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}[];

export type CreateFunctionResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  domains: string[];
  memory: number;
  timeout: number;
  env: string[];
  cron?: string;
  deployment: {
    id: string;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

const get = async (request: NextApiRequest, response: NextApiResponse<GetFunctionsResponse>) => {
  const organizationId = request.query.organizationId as string;

  const functions = await prisma.function.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      domains: true,
      memory: true,
      timeout: true,
      env: true,
      cron: true,
      deployments: {
        select: {
          id: true,
          triggerer: true,
          commit: true,
          isCurrent: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'asc',
    },
  });

  response.json(functions);
};

const post = async (request: NextApiRequest, response: NextApiResponse<CreateFunctionResponse>) => {
  const organizationId = request.query.organizationId as string;

  const { name, domains, env, cron, code, shouldTransformCode } = JSON.parse(request.body) as {
    name: string;
    domains: string[];
    env: string[];
    cron?: string;
    code: string;
    shouldTransformCode: boolean;
  };

  const func = await prisma.function.create({
    data: {
      organizationId,
      name,
      domains,
      memory: DEFAULT_MEMORY,
      timeout: DEFAULT_TIMEOUT,
      env,
      cron,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      domains: true,
      memory: true,
      timeout: true,
      env: true,
      cron: true,
    },
  });

  const deployment = await createDeployment(func, code, shouldTransformCode, request.user.email);

  response.json({ ...func, deployment });
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'GET':
      return get(request, response);
    case 'POST':
      return post(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
