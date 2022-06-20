import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { transform } from 'esbuild';
import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';
import redis from 'lib/redis';
import s3 from 'lib/s3';

export type CreateDeploymentResponse = {
  functionId: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
};

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

  const currentDeployment = await prisma.deployment.findFirst({
    where: {
      functionId,
      isCurrent: true,
    },
    select: {
      id: true,
    },
  });

  await prisma.deployment.update({
    data: {
      isCurrent: false,
    },
    where: {
      id: currentDeployment.id,
    },
  });

  const deployment = await prisma.deployment.create({
    data: {
      isCurrent: true,
      functionId,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isCurrent: true,
      functionId: true,
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

  response.json(deployment);
};

const patch = async (request: NextApiRequest, response: NextApiResponse<CreateDeploymentResponse>) => {
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

  const currentDeployment = await prisma.deployment.findFirst({
    where: {
      functionId,
      isCurrent: true,
    },
    select: {
      id: true,
    },
  });

  const previousDeployment = await prisma.deployment.update({
    data: {
      isCurrent: false,
    },
    where: {
      id: currentDeployment.id,
    },
    select: {
      id: true,
    },
  });

  await prisma.deployment.update({
    data: {
      isCurrent: true,
    },
    where: {
      id: deploymentId,
    },
  });

  await redis.publish(
    'current',
    JSON.stringify({
      previousDeploymentId: previousDeployment.id,
      functionId: func.id,
      functionName: func.name,
      deploymentId: deploymentId,
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
      isCurrent: true,
    }),
  );
};

const del = async (request: NextApiRequest, response: NextApiResponse<CreateDeploymentResponse>) => {
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

  const deployment = await prisma.deployment.delete({
    where: {
      id: deploymentId,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      functionId: true,
      isCurrent: true,
    },
  });

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
