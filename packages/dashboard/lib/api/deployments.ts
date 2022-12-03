import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import redis from 'lib/redis';
import s3 from 'lib/s3';
import prisma from 'lib/prisma';
import { Readable } from 'node:stream';
import { TRPCError } from '@trpc/server';
import { envStringToObject } from 'lib/utils';

export async function createDeployment(
  func: {
    id: string;
    name: string;
    domains: string[];
    memory: number;
    timeout: number;
    cron: string | null;
    cronRegion: string;
    env: { key: string; value: string }[];
  },
  assets: string[],
  triggerer: string,
): Promise<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isProduction: boolean;
  functionId: string;
}> {
  return prisma.deployment.create({
    data: {
      isProduction: false,
      assets: {
        createMany: {
          data: assets.map(name => ({
            name,
          })),
        },
      },
      functionId: func.id,
      triggerer,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isProduction: true,
      assets: {
        select: {
          name: true,
        },
      },
      functionId: true,
    },
  });
}

export async function removeDeployment(
  func: {
    id: string;
    name: string;
    domains: string[];
    memory: number;
    timeout: number;
    startupTimeout: number;
    cron: string | null;
    cronRegion: string;
    env: { key: string; value: string }[];
  },
  deploymentId: string,
) {
  await prisma.asset.deleteMany({
    where: {
      deploymentId,
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
      isProduction: true,
      assets: {
        select: {
          name: true,
        },
      },
    },
  });

  const deletePromises = [
    s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `${deployment.id}.js`,
      }),
    ),
  ];

  if (deployment.assets.length > 0) {
    deletePromises.push(
      s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET,
          Delete: {
            Objects: deployment.assets.map(asset => ({
              Key: `${deployment.id}/${asset}`,
            })),
          },
        }),
      ),
    );
  }

  await Promise.all(deletePromises);

  await redis.publish(
    'undeploy',
    JSON.stringify({
      functionId: func.id,
      functionName: func.name,
      deploymentId: deployment.id,
      domains: func.domains,
      memory: func.memory,
      timeout: func.timeout,
      startupTimeout: func.startupTimeout,
      cron: func.cron,
      cronRegion: func.cronRegion,
      env: envStringToObject(func.env),
      isProduction: deployment.isProduction,
      assets: deployment.assets.map(({ name }) => name),
    }),
  );
}

export async function unpromoteProductionDeployment(functionId: string): Promise<
  | {
      id: string;
    }
  | undefined
> {
  const currentDeployment = await prisma.deployment.findFirst({
    where: {
      functionId,
      isProduction: true,
    },
    select: {
      id: true,
    },
  });

  if (!currentDeployment) {
    return undefined;
  }

  return prisma.deployment.update({
    data: {
      isProduction: false,
    },
    where: {
      id: currentDeployment.id,
    },
    select: {
      id: true,
    },
  });
}

export async function promoteProductionDeployment(functionId: string, newDeploymentId: string) {
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
      startupTimeout: true,
      cron: true,
      cronRegion: true,
      env: {
        select: {
          key: true,
          value: true,
        },
      },
    },
  });

  if (!func) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }

  const previousDeployment = await unpromoteProductionDeployment(func.id);

  const deployment = await prisma.deployment.update({
    data: {
      isProduction: true,
    },
    where: {
      id: newDeploymentId,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isProduction: true,
      assets: {
        select: {
          name: true,
        },
      },
    },
  });

  await redis.publish(
    'promote',
    JSON.stringify({
      previousDeploymentId: previousDeployment?.id || '',
      functionId: func.id,
      functionName: func.name,
      deploymentId: newDeploymentId,
      domains: func.domains.map(({ domain }) => domain),
      memory: func.memory,
      timeout: func.timeout,
      startupTimeout: func.startupTimeout,
      cron: func.cron,
      cronRegion: func.cronRegion,
      env: envStringToObject(func.env),
      isProduction: true,
      assets: deployment.assets.map(({ name }) => name),
    }),
  );
}

export async function updateDomains(
  func: {
    id: string;
    name: string;
    domains: string[];
    memory: number;
    timeout: number;
    startupTimeout: number;
    cron: string | null;
    cronRegion: string;
    env: { key: string; value: string }[];
  },
  deployment: { id: string; isProduction: boolean; assets: string[] },
  oldDomains: string[],
) {
  await redis.publish(
    'undeploy',
    JSON.stringify({
      functionId: func.id,
      functionName: func.name,
      deploymentId: deployment.id,
      domains: oldDomains,
      memory: func.memory,
      timeout: func.timeout,
      startupTimeout: func.startupTimeout,
      cron: func.cron,
      cronRegion: func.cronRegion,
      env: envStringToObject(func.env),
      isProduction: deployment.isProduction,
      assets: deployment.assets,
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
      startupTimeout: func.startupTimeout,
      cron: func.cron,
      cronRegion: func.cronRegion,
      env: envStringToObject(func.env),
      isProduction: deployment.isProduction,
      assets: deployment.assets,
    }),
  );
}

export async function removeFunction(func: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  domains: {
    domain: string;
  }[];
  memory: number;
  timeout: number;
  startupTimeout: number;
  cron: string | null;
  cronRegion: string;
  env: {
    key: string;
    value: string;
  }[];
  deployments: { id: string }[];
}) {
  const deleteDeployments = func.deployments.map(deployment =>
    removeDeployment(
      {
        ...func,
        domains: func.domains.map(({ domain }) => domain),
      },
      deployment.id,
    ),
  );

  await Promise.all(deleteDeployments);
  await prisma.domain.deleteMany({
    where: {
      functionId: func.id,
    },
  });

  await prisma.function.delete({
    where: {
      id: func.id,
    },
  });
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
      Bucket: process.env.S3_BUCKET,
      Key: `${deploymentId}.js`,
    }),
  );

  if (content.Body instanceof Readable) {
    return streamToString(content.Body);
  }

  return '';
}
