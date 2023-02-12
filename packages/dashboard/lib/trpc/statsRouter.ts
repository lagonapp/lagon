import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import fetch from 'node-fetch';
import * as Sentry from '@sentry/nextjs';
import { checkCanQueryFunction } from 'lib/api/functions';

const getStep = (timeframe: Timeframe) => {
  // a point every every hour
  if (timeframe === 'Last 30 days') {
    return 30 * 60 * 60;
  } else if (timeframe === 'Last 7 days') {
    return 7 * 60 * 60;
  } else {
    return 60 * 60;
  }
};

const getRange = (timeframe: Timeframe) => {
  let start = new Date().getTime() - 24 * 60 * 60 * 1000; // 24 hours ago
  const end = new Date().getTime();

  if (timeframe === 'Last 7 days') {
    start = new Date().getTime() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
  } else if (timeframe === 'Last 30 days') {
    start = new Date().getTime() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  }

  return {
    start,
    end,
  };
};

const toUnixTimestamp = (time: number) => Math.floor(time / 1000);

const prometheus = async (query: string, timeframe: Timeframe) => {
  const { start, end } = getRange(timeframe);
  const step = getStep(timeframe);

  const url = `${process.env.PROMETHEUS_ENDPOINT}/api/v1/query_range?query=${encodeURIComponent(
    query,
  )}&start=${toUnixTimestamp(start)}&end=${toUnixTimestamp(end)}&step=${step}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.PROMETHEUS_USERNAME}:${process.env.PROMETHEUS_PASSWORD}`,
      ).toString('base64')}`,
    },
  });

  const json = (await response.json()) as {
    data: {
      resultType: string;
      result: {
        values: [number, string][];
      }[];
    };
  };

  return json.data;
};

export const statsRouter = (t: T) =>
  t.router({
    usage: t.procedure
      .input(
        z.object({
          functions: z.array(z.string()),
        }),
      )
      .query(async ({ input }) => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const end = new Date().getTime();
        const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

        const query = `sum(increase(lagon_isolate_requests{function=~"${input.functions.join('|')}"}[${totalDays}d]))`;
        const url = `${process.env.PROMETHEUS_ENDPOINT}/api/v1/query_range?query=${encodeURIComponent(
          query,
        )}&start=${toUnixTimestamp(start)}&end=${toUnixTimestamp(end)}&step=${totalDays * 60 * 60}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.PROMETHEUS_USERNAME}:${process.env.PROMETHEUS_PASSWORD}`,
            ).toString('base64')}`,
          },
        });

        const json = (await response.json()) as {
          data: {
            resultType: string;
            result: {
              values: [number, string][];
            }[];
          };
        };

        const values = json.data.result[0]?.values;

        return values ? Number(values[values.length - 1][1]) : 0;
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

        const step = getStep(input.timeframe);
        const [usage, requests, cpuTime, bytesIn, bytesOut] = await Promise.all([
          prometheus(
            `sum(increase(lagon_isolate_requests{function="${input.functionId}"}[${step * 24}s]))`,
            input.timeframe,
          ),
          prometheus(
            `sum(increase(lagon_isolate_requests{function="${input.functionId}"}[${step}s]))`,
            input.timeframe,
          ),
          prometheus(
            `avg(lagon_isolate_cpu_time{function="${input.functionId}",quantile="0.99"} > 0)`,
            input.timeframe,
          ),
          prometheus(`sum(increase(lagon_bytes_in{function="${input.functionId}"}[${step}s]))`, input.timeframe),
          prometheus(`sum(increase(lagon_bytes_out{function="${input.functionId}"}[${step}s]))`, input.timeframe),
        ]);

        const flatResult = ({ result }: Awaited<ReturnType<typeof prometheus>>) =>
          result.reduce(
            (acc, { values }) => {
              return [...acc, ...values.map(([time, value]) => ({ time, value: Number(value) }))];
            },
            [] as {
              time: number;
              value: number;
            }[],
          );

        const usageValues = usage.result[0]?.values;

        return {
          usage: usageValues ? Number(usageValues[usageValues.length - 1][1]) : 0,
          requests: flatResult(requests),
          cpuTime: flatResult(cpuTime),
          bytesIn: flatResult(bytesIn),
          bytesOut: flatResult(bytesOut),
        };
      }),
  });
