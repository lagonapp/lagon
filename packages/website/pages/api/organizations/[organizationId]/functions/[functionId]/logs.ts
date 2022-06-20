import { NextApiRequest, NextApiResponse } from 'next';
import { ClickHouse } from 'clickhouse';
import { LogLevel, Timeframe } from 'lib/types';
import apiHandler from 'lib/api';

const clickhouse = new ClickHouse({});

export type GetLogsResponse = {
  deploymentId: string;
  functionId: string;
  date: string;
  level: LogLevel;
  message: string;
}[];

const get = async (request: NextApiRequest, response: NextApiResponse<GetLogsResponse>) => {
  const functionId = request.query.functionId as string;
  const logLevel = request.query.logLevel as LogLevel;
  const timeframe = request.query.timeframe as Timeframe;

  if (timeframe === 'Last 24 hours') {
    const result = await clickhouse
      .query(
        `select * from logs where functionId='${functionId}' ${
          logLevel === 'all' ? '' : `and level='${logLevel}'`
        } and date >= subtractHours(now(), 24) order by date desc;`,
      )
      .toPromise();

    return response.json(result as GetLogsResponse);
  } else {
    const result = await clickhouse
      .query(
        `select * from logs where functionId='${functionId}' ${
          logLevel === 'all' ? '' : `and level='${logLevel}'`
        } and date >= subtractDays(now(), ${timeframe === 'Last 30 days' ? 30 : 7}) order by date desc;`,
      )
      .toPromise();

    return response.json(result as GetLogsResponse);
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
