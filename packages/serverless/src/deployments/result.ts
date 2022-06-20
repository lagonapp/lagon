import { DeploymentResult, Deployment } from '@lagon/runtime';
import { ClickHouse } from 'clickhouse';
import { Isolate } from 'isolated-vm';

const clickhouse = new ClickHouse({});
const previousResources = new Map<string, { cpuTime: bigint; memory: number }>();
const deploymentsResult = new Map<[string, string], DeploymentResult[]>();
const lastRequests = new Map<string, Date>();

let lastBatch: number;

function sendResultsToClickhouse() {
  deploymentsResult.forEach((functionResult, [functionId, deploymentId]) => {
    clickhouse
      .query(
        `INSERT INTO functions_result (date, functionId, deploymentId, cpuTime, memory, sendBytes, receivedBytes, requests) VALUES (now(), '${functionId}', '${deploymentId}', ${
          functionResult.reduce((acc, current) => {
            return acc + current.cpuTime;
          }, BigInt(0)) / BigInt(functionResult.length)
        }, ${
          functionResult.reduce((acc, current) => {
            return acc + current.memory;
          }, 0) / functionResult.length
        }, ${
          functionResult.reduce((acc, current) => {
            return acc + current.sentBytes;
          }, 0) / functionResult.length
        }, ${
          functionResult.reduce((acc, current) => {
            return acc + current.receivedBytes;
          }, 0) / functionResult.length
        }, ${functionResult.length})`,
      )
      .toPromise();

    functionResult.forEach(functionResult => {
      functionResult.logs.forEach(log => {
        clickhouse
          .query(
            `INSERT INTO logs (date, functionId, deploymentId, level, message) VALUES (now(), '${functionId}', '${deploymentId}', '${log.level}', '${log.content}')`,
          )
          .toPromise();
      });
    });
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
