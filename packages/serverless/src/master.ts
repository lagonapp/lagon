import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Deployment, fetch } from '@lagon/runtime';
import cluster from 'node:cluster';
import { cpus } from 'node:os';
import { Readable } from 'node:stream';
import { createClient } from 'redis';
import {
  deleteDeploymentCode,
  deleteOldDeployments,
  hasDeploymentCodeLocally,
  writeAssetContent,
  writeDeploymentCode,
} from 'src/deployments';

const IS_DEV = process.env.NODE_ENV !== 'production';
const CPUS = cpus().length / 2;

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export default async function master() {
  const desiredWorkers = IS_DEV ? 1 : CPUS;
  let deployments: Deployment[] = [];

  try {
    const response = await fetch(`${process.env.LAGON_API_URL}/deployments`, {
      headers: {
        'x-lagon-token': process.env.LAGON_TOKEN,
      },
    });

    deployments = JSON.parse(response.body);
  } catch (e) {
    console.log('Could not fetch deployments from API');
  }

  for (let i = 0; i < desiredWorkers; i++) {
    const worker = cluster.fork();

    worker.on('message', () => {
      worker.send({ msg: 'deployments', data: deployments });
    });
  }

  cluster.on('exit', worker => {
    console.log(`Worker ${worker.process.pid} died`);

    const newWorker = cluster.fork();

    newWorker.on('message', () => {
      newWorker.send({ msg: 'deployments', data: deployments });
    });
  });

  const redis = createClient({
    url: process.env.REDIS_URL,
  });

  await redis.connect();

  const s3 = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  deleteOldDeployments(deployments);

  for (const deployment of deployments) {
    if (!hasDeploymentCodeLocally(deployment)) {
      const content = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${deployment.deploymentId}.js`,
        }),
      );

      const code = await streamToString(content.Body);
      writeDeploymentCode(deployment, code);

      const assets = await s3.send(
        new ListObjectsV2Command({
          Bucket: process.env.AWS_S3_BUCKET,
          Prefix: `${deployment.deploymentId}/`,
        }),
      );

      for (const asset of assets.Contents || []) {
        const content = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: asset.Key,
          }),
        );

        const assetContent = await streamToString(content.Body);
        writeAssetContent(asset.Key as string, assetContent);
      }
    }
  }

  await redis.subscribe('deploy', async message => {
    const deployment = JSON.parse(message);

    const content = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${deployment.deploymentId}.js`,
      }),
    );

    const code = await streamToString(content.Body);
    writeDeploymentCode(deployment, code);

    const assets = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: `${deployment.deploymentId}/`,
      }),
    );

    for (const asset of assets.Contents || []) {
      const content = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: asset.Key,
        }),
      );

      const assetContent = await streamToString(content.Body);
      writeAssetContent(asset.Key as string, assetContent);
    }

    for (const i in cluster.workers) {
      cluster.workers[i]?.send({ msg: 'deploy', data: deployment });
    }
  });

  await redis.subscribe('undeploy', message => {
    const deployment = JSON.parse(message);

    deleteDeploymentCode(deployment);

    for (const i in cluster.workers) {
      cluster.workers[i]?.send({ msg: 'undeploy', data: deployment });
    }
  });

  await redis.subscribe('current', message => {
    const deployment = JSON.parse(message);

    for (const i in cluster.workers) {
      cluster.workers[i]?.send({ msg: 'current', data: deployment });
    }
  });

  setInterval(() => {
    for (const i in cluster.workers) {
      cluster.workers[i]?.send({ msg: 'clean' });
    }
  }, 1000 * 60);
}
