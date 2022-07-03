import { DeploymentResult, Deployment } from '@lagon/runtime';
import { Isolate } from 'isolated-vm';
import { Worker } from 'node:worker_threads';

const previousResources = new Map<string, { cpuTime: bigint; memory: number }>();
const deploymentsResult = new Map<[string, string], DeploymentResult[]>();
const lastRequests = new Map<string, Date>();

let lastBatch: number;

function sendResultsToClickhouse() {
  new Worker('./dist/clickhouse.js', {
    workerData: deploymentsResult,
  });

  deploymentsResult.clear();
}

export function calculateIsolateResources({
  isolate,
  deployment,
  deploymentResult,
}: {
  isolate: Isolate;
  deployment: Deployment;
  deploymentResult: DeploymentResult;
}) {
  const cpuTime = isolate.cpuTime || BigInt(0);
  const memory = isolate.getHeapStatisticsSync()?.used_heap_size || 0;

  const previousResource = previousResources.get(deployment.deploymentId);

  const finalCpuTime = previousResource ? cpuTime - previousResource.cpuTime : cpuTime;
  const finalMemory = previousResource ? memory - previousResource.memory : memory;

  deploymentResult.cpuTime = finalCpuTime;
  deploymentResult.memory = finalMemory;

  previousResources.set(deployment.deploymentId, { cpuTime, memory });
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
    sendResultsToClickhouse();
  }

  if (Date.now() - lastBatch > 1000) {
    lastBatch = Date.now();
    sendResultsToClickhouse();
  }
}

export function shouldClearCache(deployment: Deployment, now: Date) {
  const lastRequest = lastRequests.get(deployment.deploymentId);

  if (!lastRequest) {
    return false;
  }

  const timeElapsed = lastRequest.getTime() + 1000 * 60 * 10 <= now.getTime();

  if (timeElapsed) {
    lastRequests.delete(deployment.deploymentId);
  }

  return timeElapsed;
}
