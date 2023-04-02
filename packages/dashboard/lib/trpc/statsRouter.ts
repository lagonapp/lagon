import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { TIMEFRAMES } from 'lib/types';
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
          timeframe: z.enum(TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

        const groupBy = input.timeframe === 'Last 24 hours' ? 'toStartOfHour' : 'toStartOfDay';
        const limit = input.timeframe === 'Last 24 hours' ? 24 : input.timeframe === 'Last 30 days' ? 30 : 7;

        const result = (await clickhouse
          .query(
            `SELECT
  count(*) as requests,
  sum(bytes_in) as bytesIn,
  sum(bytes_out) as bytesOut,
  ${groupBy}(timestamp) AS time
FROM serverless.requests
WHERE
  function_id = '${input.functionId}'
GROUP BY time
ORDER BY time
LIMIT ${limit}`,
          )
          .toPromise()) as { requests: number; bytesIn: number; bytesOut: number; time: string }[];

        return result;
      }),
  });
