import { ClickHouse } from 'clickhouse';
import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import { Timeframe } from 'lib/types';

const clickhouse = new ClickHouse({});

export type GetFunctionStatsResponse = {
  date: string;
  requests: number;
  memory: number;
  cpu: number;
  receivedBytes: number;
  sendBytes: number;
}[];

const get = async (request: NextApiRequest, response: NextApiResponse<GetFunctionStatsResponse>) => {
  // const organizationId = request.query.organizationId as string;
  const functionId = request.query.functionId as string;
  const timeframe = request.query.timeframe as Timeframe;

  if (timeframe === 'Last 24 hours') {
    const result = await clickhouse
      .query(
        `select toStartOfHour(date), sum(requests), avg(memory), avg(cpuTime), sum(receivedBytes), sum(sendBytes) from functions_result where functionId='${functionId}' and date >= subtractHours(now(), 24) group by toStartOfHour(date)`,
      )
      .toPromise();

    const stats = result.map(record => {
      return {
        date: record['toStartOfHour(date)'],
        requests: record['sum(requests)'],
        memory: record['avg(memory)'],
        cpu: record['avg(cpuTime)'],
        receivedBytes: record['sum(receivedBytes)'],
        sendBytes: record['sum(sendBytes)'],
      };
    });

    return response.json(stats);
  } else {
    const result = await clickhouse
      .query(
        `select toStartOfDay(date), sum(requests), avg(memory), avg(cpuTime), sum(receivedBytes), sum(sendBytes) from functions_result where functionId='${functionId}' and date >= subtractDays(now(), ${
          timeframe === 'Last 30 days' ? 30 : 7
        }) group by toStartOfDay(date)`,
      )
      .toPromise();

    const stats = result.map(record => {
      return {
        date: record['toStartOfDay(date)'],
        requests: record['sum(requests)'],
        memory: record['avg(memory)'],
        cpu: record['avg(cpuTime)'],
        receivedBytes: record['sum(receivedBytes)'],
        sendBytes: record['sum(sendBytes)'],
      };
    });

    return response.json(stats);
  }
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'GET':
      return get(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
