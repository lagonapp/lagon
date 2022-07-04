import { workerData } from 'node:worker_threads';
import { DeploymentResult } from '@lagon/runtime';
import prisma from '@lagon/prisma';

const deploymentsResult: Map<[string, string], DeploymentResult[]> = workerData;

async function send() {
  const stats: {
    functionId: string;
    deploymentId: string;
    cpuTime: number;
    memory: number;
    sendBytes: number;
    receivedBytes: number;
    requests: number;
  }[] = [];

  const logs: {
    functionId: string;
    deploymentId: string;
    level: string;
    message: string;
  }[] = [];

  deploymentsResult.forEach((functionResults, [functionId, deploymentId]) => {
    stats.push({
      functionId,
      deploymentId,
      cpuTime:
        functionResults.reduce((acc, current) => {
          return acc + Number(current.cpuTime);
        }, 0) / functionResults.length,
      memory:
        functionResults.reduce((acc, current) => {
          return acc + current.memory;
        }, 0) / functionResults.length,
      sendBytes:
        functionResults.reduce((acc, current) => {
          return acc + current.sentBytes;
        }, 0) / functionResults.length,
      receivedBytes:
        functionResults.reduce((acc, current) => {
          return acc + current.receivedBytes;
        }, 0) / functionResults.length,
      requests: functionResults.length,
    });

    functionResults.forEach(functionResult => {
      functionResult.logs.forEach(log => {
        logs.push({
          functionId,
          deploymentId,
          level: log.level.toUpperCase(),
          message: log.content,
        });
      });
    });
  });

  await prisma.stat.createMany({
    data: stats,
  });

  await prisma.log.createMany({
    // @ts-expect-error LogLevel casted to a string
    data: logs,
  });
}

send();
