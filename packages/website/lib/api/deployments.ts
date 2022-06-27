import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import redis from 'lib/redis';
import s3 from 'lib/s3';
import { transform } from 'esbuild';
import prisma from 'lib/prisma';
import { envStringToObject } from 'lib/api/env';
import { Readable } from 'node:stream';
import * as trpc from '@trpc/server';

export async function transformCode(code: string) {
  const { code: finalCode } = await transform(code, {
    loader: 'ts',
    format: 'esm',
    target: 'es2020',
    // TODO: minify identifiers
    // Can't minify identifiers yet because `masterHandler` in runtime
    // needs to call a `handler` function.
    minifyWhitespace: true,
    minifySyntax: true,
  });

  return finalCode;
}

export async function createDeployment(
  func: {
    id: string;
    name: string;
    domains: string[];
    memory: number;
    timeout: number;
    env: string[];
  },
  code: string,
  shouldTransformCode: boolean,
  triggerer: string,
): Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
  functionId: string;
}> {
  const deployment = await prisma.deployment.create({
    data: {
      isCurrent: true,
      functionId: func.id,
      triggerer,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isCurrent: true,
      functionId: true,
    },
  });

  const finalCode = shouldTransformCode ? await transformCode(code) : code;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
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
      env: envStringToObject(func.env),
      isCurrent: deployment.isCurrent,
    }),
  );

  return deployment;
}

export async function removeDeployment(
  func: {
    id: string;
    name: string;
    domains: string[];
    memory: number;
    timeout: number;
    env: string[];
  },
  deploymentId: string,
): Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
  functionId: string;
}> {
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
      Bucket: process.env.AWS_S3_BUCKET,
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
      env: envStringToObject(func.env),
      isCurrent: deployment.isCurrent,
    }),
  );

  return deployment;
}

export async function removeCurrentDeployment(functionId: string): Promise<{
  id: string;
}> {
  const currentDeployment = await prisma.deployment.findFirst({
    where: {
      functionId,
      isCurrent: true,
    },
    select: {
      id: true,
    },
  });

  if (!currentDeployment) {
    throw new trpc.TRPCError({
      code: 'NOT_FOUND',
    });
  }

  return prisma.deployment.update({
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
}

export async function setCurrentDeployment(
  functionId: string,
  newDeploymentId: string,
): Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
}> {
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

  if (!func) {
    throw new trpc.TRPCError({
      code: 'NOT_FOUND',
    });
  }

  const previousDeployment = await removeCurrentDeployment(func.id);

  const deployment = await prisma.deployment.update({
    data: {
      isCurrent: true,
    },
    where: {
      id: newDeploymentId,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isCurrent: true,
    },
  });

  await redis.publish(
    'current',
    JSON.stringify({
      previousDeploymentId: previousDeployment.id,
      functionId: func.id,
      functionName: func.name,
      deploymentId: newDeploymentId,
      domains: func.domains,
      memory: func.memory,
      timeout: func.timeout,
      env: envStringToObject(func.env),
      isCurrent: true,
    }),
  );

  return deployment;
}

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export async function getDeploymentCode(deploymentId: string) {
  const content = await s3.send(
    new GetObjectCommand({
      Bucket: 'lagonapp',
      Key: `${deploymentId}.js`,
    }),
  );

  if (content.Body instanceof Readable) {
    return streamToString(content.Body);
  }

  return '';
}
