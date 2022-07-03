import { workerData } from 'node:worker_threads';
import { ClickHouse } from 'clickhouse';

const clickhouse = new ClickHouse({});

workerData.forEach((functionResult, [functionId, deploymentId]) => {
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
