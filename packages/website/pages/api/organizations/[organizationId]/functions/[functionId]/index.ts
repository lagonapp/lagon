import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { ClickHouse } from 'clickhouse';
import apiHandler, { handlePrismaError } from 'lib/api';
import { removeDeployment } from 'lib/api/deployments';

const clickhouse = new ClickHouse({});

export type GetFunctionResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  domains: string[];
  memory: number;
  timeout: number;
  env?: string[];
  cron?: string;
  deployments: {
    id: string;
    isCurrent: boolean;
    triggerer: string;
    commit?: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type UpdateFunctionResponse = GetFunctionResponse;

export type DeleteFunctionResponse = GetFunctionResponse;

const get = async (request: NextApiRequest, response: NextApiResponse<GetFunctionResponse>) => {
  const organizationId = request.query.organizationId as string;
  const functionId = request.query.functionId as string;

  const func = await prisma.function.findFirst({
    where: {
      id: functionId,
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
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  response.json(func);
};

const patch = async (request: NextApiRequest, response: NextApiResponse<UpdateFunctionResponse>) => {
  const functionId = request.query.functionId as string;

  const { name, domains, cron, env } = JSON.parse(request.body) as {
    name: string;
    domains: string[];
    cron?: string;
    env: string[];
  };

  try {
    const func = await prisma.function.update({
      where: {
        id: functionId,
      },
      data: {
        name,
        domains,
        cron,
        env,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        domains: true,
        memory: true,
        timeout: true,
        cron: true,
        env: true,
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
    });

    // TODO: redeploy when needed

    response.json(func);
  } catch (error) {
    handlePrismaError(error, response);
  }
};

const del = async (request: NextApiRequest, response: NextApiResponse<DeleteFunctionResponse>) => {
  const functionId = request.query.functionId as string;

  const func = await prisma.function.delete({
    where: {
      id: functionId,
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
  });

  for (const deployment of func.deployments) {
    await removeDeployment(func, deployment.id);
  }

  await clickhouse.query(`alter table functions_result delete where functionId='${func.id}'`).toPromise();
  await clickhouse.query(`alter table logs delete where functionId='${func.id}'`).toPromise();

  response.json(func);
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'GET':
      return get(request, response);
    case 'PATCH':
      return patch(request, response);
    case 'DELETE':
      return del(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
