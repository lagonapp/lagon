import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import prisma from '@lagon/prisma';
import cluster from 'node:cluster';
import { Readable } from 'node:stream';
import { createClient } from 'redis';
import {
  deleteDeploymentCode,
  deleteOldDeployments,
  hasDeploymentCodeLocally,
  writeAssetContent,
  writeDeploymentCode,
} from 'src/deployments';
import { envStringToObject } from '@lagon/common';
import { IS_DEV } from '../constants';
import cronParser from 'cron-parser';
const { parseExpression } = cronParser;

async function streamToString(stream: Readable): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export default async function master() {
  const desiredWorkers = IS_DEV ? 1 : parseInt(process.env.LAGON_WORKERS || '1');

  const deployments = (
    await prisma.deployment.findMany({
      select: {
        id: true,
        isCurrent: true,
        assets: {
          select: {
            name: true,
          },
        },
        function: {
          select: {
            id: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            cron: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
          },
        },
      },
      where: {
        function: {
          cronRegion: process.env.LAGON_REGION,
        },
      },
    })
  ).map(
    ({
      id: deploymentId,
      isCurrent,
      assets,
      function: { id: functionId, name: functionName, domains, memory, timeout, cron, env },
    }) => ({
      functionId,
      functionName,
      deploymentId,
      domains: domains.map(({ domain }) => domain),
      memory,
      timeout,
      cron,
      env: envStringToObject(env),
      isCurrent,
      assets: assets.map(({ name }) => name),
    }),
  );

  const finalDeployments = deployments.filter(deployment => deployment.cron === null);
  let cronDeployments = deployments.filter(deployment => deployment.cron !== null);

  for (let i = 0; i < desiredWorkers; i++) {
    const worker = cluster.fork({
      LAGON_REGION: process.env.LAGON_REGION,
    });

    worker.on('message', () => {
      worker.send({ msg: 'deployments', data: finalDeployments });
    });
  }

  cluster.on('exit', worker => {
    console.log(`Worker ${worker.process.pid} died`);

    const newWorker = cluster.fork();

    newWorker.on('message', () => {
      newWorker.send({ msg: 'deployments', data: finalDeployments });
    });
  });

  const redis = createClient({
    url: process.env.REDIS_URL,
  });

  await redis.connect();

  const s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  });

  deleteOldDeployments(deployments);

  const downloadPromises = deployments.map(async deployment => {
    if (!hasDeploymentCodeLocally(deployment)) {
      const content = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: `${deployment.deploymentId}.js`,
        }),
      );

      const code = await streamToString(content.Body);
      writeDeploymentCode(deployment, code);

      const assets = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.S3_BUCKET,
          Prefix: `${deployment.deploymentId}/`,
        }),
      );

      for (const asset of assets.Contents || []) {
        const content = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: asset.Key,
          }),
        );

        const assetContent = await streamToString(content.Body);
        writeAssetContent(asset.Key as string, assetContent);
      }
    }
  });

  await Promise.all(downloadPromises);

  await redis.subscribe('deploy', async message => {
    const deployment = JSON.parse(message);

    const [assets] = await Promise.all([
      s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.S3_BUCKET,
          Prefix: `${deployment.deploymentId}/`,
        }),
      ),
      (async () => {
        const content = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: `${deployment.deploymentId}.js`,
          }),
        );

        const code = await streamToString(content.Body);
        writeDeploymentCode(deployment, code);
      })(),
    ]);

    await Promise.all(
      (assets.Contents || []).map(async asset => {
        const content = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: asset.Key,
          }),
        );

        const assetContent = await streamToString(content.Body);
        writeAssetContent(asset.Key as string, assetContent);
      }),
    );

    if (deployment.cron === null) {
      for (const i in cluster.workers) {
        cluster.workers[i]?.send({ msg: 'deploy', data: deployment });
      }
    } else if (deployment.cronRegion === process.env.LAGON_REGION) {
      cronDeployments.push(deployment);
    }
  });

  await redis.subscribe('undeploy', message => {
    const deployment = JSON.parse(message);

    deleteDeploymentCode(deployment);

    if (deployment.cron === null) {
      for (const i in cluster.workers) {
        cluster.workers[i]?.send({ msg: 'undeploy', data: deployment });
      }
    } else {
      cronDeployments = cronDeployments.filter(({ deploymentId }) => deploymentId !== deployment.deploymentId);
    }
  });

  await redis.subscribe('current', message => {
    const deployment = JSON.parse(message);

    if (deployment.cron === null) {
      for (const i in cluster.workers) {
        cluster.workers[i]?.send({ msg: 'current', data: deployment });
      }
    }
  });

  await redis.subscribe('domains', message => {
    const deployment = JSON.parse(message);

    if (deployment.cron === null) {
      for (const i in cluster.workers) {
        cluster.workers[i]?.send({ msg: 'domains', data: deployment });
      }
    }
  });

  setInterval(() => {
    for (const i in cluster.workers) {
      cluster.workers[i]?.send({ msg: 'clean' });
    }

    for (const deployment of cronDeployments) {
      const interval = parseExpression(deployment.cron!);
      const next = interval.prev();
      const now = new Date();

      if (
        !(
          next.getMinutes() === now.getMinutes() &&
          next.getHours() === now.getHours() &&
          next.getDate() === now.getDate() &&
          next.getMonth() === now.getMonth() &&
          next.getDay() === now.getDay()
        )
      ) {
        return;
      }

      // Find a random worker the run the deployment
      const id = Math.floor(Math.random() * desiredWorkers) + 1;
      const worker = cluster.workers![id];
      worker?.send({ msg: 'cron', data: deployment });
    }
  }, 1000 * 60); // 1min
}
