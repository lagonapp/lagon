import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import redis from 'lib/redis';
import s3 from 'lib/s3';
import prisma from 'lib/prisma';
import { Readable } from 'node:stream';
import { TRPCError } from '@trpc/server';
import { envStringToObject } from 'lib/utils';
import { checkCanQueryFunction } from './functions';
import { Plan } from 'lib/plans';

export async function createDeployment(
  func: {
    id: string;
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
      assets,
      functionId: func.id,
      triggerer,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      isProduction: true,
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
    tickTimeout: number;
    totalTimeout: number;
    cron: string | null;
    cronRegion: string;
    env: { key: string; value: string }[];
  },
  deploymentId: string,
) {
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
      assets: true,
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

  if (Array.isArray(deployment.assets) && deployment.assets.length > 0) {
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
      tickTimeout: func.tickTimeout,
      totalTimeout: func.totalTimeout,
      cron: func.cron,
      cronRegion: func.cronRegion,
      env: envStringToObject(func.env),
      isProduction: deployment.isProduction,
      assets: deployment.assets,
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
      tickTimeout: true,
      totalTimeout: true,
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
      assets: true,
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
      tickTimeout: func.totalTimeout,
      totalTimeout: func.totalTimeout,
      cron: func.cron,
      cronRegion: func.cronRegion,
      env: envStringToObject(func.env),
      isProduction: true,
      assets: deployment.assets,
    }),
  );
}

export async function redeploy(
  func: {
    id: string;
    name: string;
    domains: string[];
    memory: number;
    tickTimeout: number;
    totalTimeout: number;
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
      tickTimeout: func.tickTimeout,
      totalTimeout: func.totalTimeout,
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
      tickTimeout: func.tickTimeout,
      totalTimeout: func.totalTimeout,
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
  tickTimeout: number;
  totalTimeout: number;
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

  const deleteDomains = prisma.domain.deleteMany({
    where: {
      functionId: func.id,
    },
  });

  const deleteEnvVariables = prisma.envVariable.deleteMany({
    where: {
      functionId: func.id,
    },
  });

  await Promise.all([deleteDomains, deleteEnvVariables]);

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
  try {
    const tsContent = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `${deploymentId}.ts`,
      }),
    );

    if (tsContent.Body instanceof Readable) {
      return streamToString(tsContent.Body);
    }
  } catch (e) {}

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

export async function checkCanCreateDeployment({
  assets,
  functionId,
  userId,
  plan,
}: {
  assets: number;
  functionId: string;
  userId: string;
  plan: Plan;
}) {
  if (assets > plan.maxAssetsPerFunction) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `You can only have ${plan.maxAssetsPerFunction} assets per Deployment in your current plan`,
    });
  }

  await checkCanQueryFunction({
    functionId,
    userId,
  });
}
