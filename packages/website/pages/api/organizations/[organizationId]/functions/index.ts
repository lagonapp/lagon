import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import redis from 'lib/redis';
import s3 from 'lib/s3';
import { transform } from 'esbuild';
import apiHandler from 'lib/api';

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
          isCurrent: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  response.json(functions);
};

const post = async (request: NextApiRequest, response: NextApiResponse<CreateFunctionResponse>) => {
  const organizationId = request.query.organizationId as string;

  const { name, domains, memory, timeout, env, cron, code } = JSON.parse(request.body) as {
    name: string;
    domains: string[];
    memory: number;
    timeout: number;
    env: string[];
    cron?: string;
    code: string;
  };

  const func = await prisma.function.create({
    data: {
      organizationId,
      name,
      domains,
      memory,
      timeout,
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

  const deployment = await prisma.deployment.create({
    data: {
      isCurrent: true,
      functionId: func.id,
    },
    select: {
      id: true,
      isCurrent: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const { code: finalCode } = await transform(code, {
    loader: 'ts',
    format: 'esm',
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: 'lagonapp',
      Key: `${deployment.id}.js`,
      Body: finalCode,
    }),
  );

  await redis.publish(
    'deploy',
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
