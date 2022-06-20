import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import redis from 'lib/redis';
import s3 from 'lib/s3';
import { ClickHouse } from 'clickhouse';
import apiHandler from 'lib/api';

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
    createdAt: Date;
    updatedAt: Date;
  }[];
};

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
          isCurrent: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  response.json(func);
};

const patch = async (request: NextApiRequest, response: NextApiResponse<GetFunctionResponse>) => {
  const functionId = request.query.functionId as string;

  const { name, domains, cron, env } = JSON.parse(request.body) as {
    name: string;
    domains: string[];
    cron?: string;
    env: string[];
  };

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
          isCurrent: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // TODO: redeploy when needed

  response.json(func);
};

const del = async (request: NextApiRequest, response: NextApiResponse) => {
  const functionId = request.query.functionId as string;

  const func = await prisma.function.delete({
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
      deployments: {
        select: {
          id: true,
          isCurrent: true,
        },
      },
    },
  });

  for (const deployment of func.deployments) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: 'lagonapp',
        Key: `${deployment.id}.js`,
      }),
    );

    await redis.publish(
      'undeploy',
      JSON.stringify({
        functionId: func.id,
        functionName: func.name,
        deploymentId: deployment.id,
        domains: func.domains,
        memory: func.memory,
        timeout: func.timeout,
        env: func.env.reduce((acc, current) => {
          const [key, value] = current.split('=');

          return {
            ...acc,
            [key]: value,
          };
        }, {}),
        isCurrent: deployment.isCurrent,
      }),
    );
  }

  await clickhouse.query(`alter table functions_result delete where functionId='${func.id}'`).toPromise();
  await clickhouse.query(`alter table logs delete where functionId='${func.id}'`).toPromise();

  response.end();
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
