import { workerData } from 'node:worker_threads';
import { ClickHouse } from 'clickhouse';
import { DeploymentResult } from '@lagon/runtime';

const clickhouse = new ClickHouse({});
const deploymentsResult: Map<[string, string], DeploymentResult[]> = workerData;

let functionsResultQuery =
  'INSERT INTO functions_result (date, functionId, deploymentId, cpuTime, memory, sendBytes, receivedBytes, requests) VALUES';
let logsQuery = 'INSERT INTO logs (date, functionId, deploymentId, level, message) VALUES';

async function send() {
  deploymentsResult.forEach((functionResult, [functionId, deploymentId]) => {
    functionsResultQuery += ` (now(), '${functionId}', '${deploymentId}', ${
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
    }, ${functionResult.length})`;

    functionResult.forEach(functionResult => {
      functionResult.logs.forEach(log => {
        logsQuery += ` (now(), '${functionId}', '${deploymentId}', '${log.level}', '${log.content}')`;
      });
    });
  });

  await Promise.all([clickhouse.query(functionsResultQuery).toPromise(), clickhouse.query(logsQuery).toPromise()]);
}

send();
