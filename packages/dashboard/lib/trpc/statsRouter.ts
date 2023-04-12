import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { ANALYTICS_TIMEFRAMES } from 'lib/types';
import { checkCanQueryFunction } from 'lib/api/functions';
import clickhouse from 'lib/clickhouse';

export const statsRouter = (t: T) =>
  t.router({
    usage: t.procedure
      .input(
        z.object({
          functions: z.array(z.string()),
        }),
      )
      .query(async ({ input }) => {
        const result = (await clickhouse
          .query(
            `SELECT
  count(*) as requests
FROM serverless.requests
WHERE
  function_id IN ('${input.functions.join("','")}')
AND
  timestamp >= toStartOfMonth(now())`,
          )
          .toPromise()) as { requests: number }[];

        return result[0]?.requests || 0;
      }),
    stats: t.procedure
      .input(
        z.object({
          timeframe: z.enum(ANALYTICS_TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

        const groupBy = input.timeframe === 'Last 24 hours' ? 'toStartOfHour' : 'toStartOfDay';

        const result = (await clickhouse
          .query(
            `SELECT
  count(*) as requests,
  avg(cpu_time_micros) as cpuTime,
  sum(bytes_in) as bytesIn,
  sum(bytes_out) as bytesOut,
  ${groupBy}(timestamp) AS time
FROM serverless.requests
WHERE
  function_id = '${input.functionId}'
AND
  timestamp >= now() - INTERVAL  ${
    input.timeframe === 'Last 24 hours' ? 1 : input.timeframe === 'Last 7 days' ? 7 : 30
  } DAY
GROUP BY time`,
          )
          .toPromise()) as { requests: number; cpuTime: number; bytesIn: number; bytesOut: number; time: string }[];

        return result;
      }),
  });
