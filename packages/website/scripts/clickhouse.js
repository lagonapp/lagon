const { ClickHouse } = require('clickhouse');

const clickhouse = new ClickHouse({});

clickhouse
  .query(
    'CREATE TABLE IF NOT EXISTS functions_result (date Datetime, functionId String, deploymentId String, cpuTime Int64, memory Int64, sendBytes Int64, receivedBytes Int64, requests Int64) ENGINE = MergeTree ORDER BY date;',
  )
  .exec(() => {
    console.log('functions_result table created');
  });

clickhouse
  .query(
    'CREATE TABLE IF NOT EXISTS logs (date Datetime, functionId String, deploymentId String, level String, message String) ENGINE = MergeTree ORDER BY date;',
  )
  .exec(() => {
    console.log('logs table created');
  });
