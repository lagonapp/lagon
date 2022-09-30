import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import fetch from 'node-fetch';

const getStep = (timeframe: Timeframe) => {
  if (timeframe === 'Last 30 days') {
    return 24 * 60;
  } else if (timeframe === 'Last 7 days') {
    return 24 * 60;
  } else {
    return 60 * 10;
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
    statsRequests: t.procedure
      .input(
        z.object({
          timeframe: z.enum(TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const step = getStep(input.timeframe);
        const { result } = await prometheus(
          `increase(lagon_requests{function="${input.functionId}"}[${step}s])`,
          input.timeframe,
        );

        return result.reduce(
          (acc, { values }) => {
            return [...acc, ...values.map(([time, value]) => ({ time: time * 1000, value: Number(value) }))];
          },
          [] as {
            time: number;
            value: number;
          }[],
        );
      }),
    statsCpuTime: t.procedure
      .input(
        z.object({
          timeframe: z.enum(TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const { result } = await prometheus(
          `lagon_isolate_cpu_time{function="${input.functionId}",quantile="0.99"}`,
          input.timeframe,
        );

        return result.reduce(
          (acc, { values }) => {
            return [...acc, ...values.map(([time, value]) => ({ time: time * 1000, value: Number(value) }))];
          },
          [] as {
            time: number;
            value: number;
          }[],
        );
      }),
    statsMemoryUsage: t.procedure
      .input(
        z.object({
          timeframe: z.enum(TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const { result } = await prometheus(
          `lagon_isolate_memory_usage{function="${input.functionId}"}`,
          input.timeframe,
        );

        return result.reduce(
          (acc, { values }) => {
            return [...acc, ...values.map(([time, value]) => ({ time: time * 1000, value: Number(value) }))];
          },
          [] as {
            time: number;
            value: number;
          }[],
        );
      }),
    statsBytesIn: t.procedure
      .input(
        z.object({
          timeframe: z.enum(TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const step = getStep(input.timeframe);
        const { result } = await prometheus(
          `increase(lagon_bytes_in{function="${input.functionId}"}[${step}s])`,
          input.timeframe,
        );

        return result.reduce(
          (acc, { values }) => {
            return [...acc, ...values.map(([time, value]) => ({ time: time * 1000, value: Number(value) }))];
          },
          [] as {
            time: number;
            value: number;
          }[],
        );
      }),
    statsBytesOut: t.procedure
      .input(
        z.object({
          timeframe: z.enum(TIMEFRAMES),
          functionId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const step = getStep(input.timeframe);
        const { result } = await prometheus(
          `increase(lagon_bytes_out{function="${input.functionId}"}[${step}s])`,
          input.timeframe,
        );

        return result.reduce(
          (acc, { values }) => {
            return [...acc, ...values.map(([time, value]) => ({ time: time * 1000, value: Number(value) }))];
          },
          [] as {
            time: number;
            value: number;
          }[],
        );
      }),
  });
