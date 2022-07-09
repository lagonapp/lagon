import { DeploymentResult, Deployment } from '@lagon/runtime';
import { Isolate } from 'isolated-vm';
import { Worker } from 'node:worker_threads';

const CACHE_MS = 1000 * 10 * 60; // 10min

const previousCpuTimes = new Map<string, bigint>();
const deploymentsResult = new Map<[string, string], DeploymentResult[]>();
const lastRequests = new Map<string, Date>();

let lastBatch: number;

function sendResultsToDb() {
  new Worker('./dist/exporter.js', {
    workerData: deploymentsResult,
  });

  deploymentsResult.clear();
}

export function getCpuTime({ isolate, deployment }: { isolate: Isolate; deployment: Deployment }) {
  const cpuTime = isolate.cpuTime || BigInt(0);

  const previousCpuTime = previousCpuTimes.get(deployment.deploymentId);
  const finalCpuTime = previousCpuTime ? cpuTime - previousCpuTime : cpuTime;

  previousCpuTimes.set(deployment.deploymentId, finalCpuTime);

  return finalCpuTime;
}

export function addDeploymentResult({
  deployment,
  deploymentResult,
}: {
  deployment: Deployment;
  deploymentResult: DeploymentResult;
}) {
  const funcRuntimeResult = deploymentsResult.get([deployment.functionId, deployment.deploymentId]) || [];
  funcRuntimeResult.push(deploymentResult);

  deploymentsResult.set([deployment.functionId, deployment.deploymentId], funcRuntimeResult);
  lastRequests.set(deployment.deploymentId, new Date());

  if (!lastBatch) {
    lastBatch = Date.now();
    sendResultsToDb();
  }

  if (Date.now() - lastBatch > 1000) {
    lastBatch = Date.now();
    sendResultsToDb();
  }
}

export function clearStatsCache(deployment: Deployment) {
  lastRequests.delete(deployment.deploymentId);
  previousCpuTimes.delete(deployment.deploymentId);
}

export function shouldClearCache(deployment: Deployment, now: Date) {
  const lastRequest = lastRequests.get(deployment.deploymentId);

  if (!lastRequest) {
    return false;
  }

  return lastRequest.getTime() + CACHE_MS <= now.getTime();
}
