import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import fetch from 'node-fetch';

const getRange = (timeframe: Timeframe) => {
  let start = new Date().getTime() - 24 * 60 * 60 * 1000;
  const end = new Date().getTime();
  let step = 60 * 60;

  if (timeframe === 'Last 7 days') {
    start = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    step = 24 * 60;
  } else if (timeframe === 'Last 30 days') {
    start = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
    step = 24 * 60;
  }

  return {
    start,
    end,
    step,
  };
};

const prometheus = async (query: string, timeframe: Timeframe) => {
  const { start, end, step } = getRange(timeframe);
  const url = `${process.env.PROMETHEUS_ENDPOINT}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${
    start / 1000
  }&end=${end / 1000}&step=${step}`;

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
        const { result } = await prometheus(`lagon_requests{function="${input.functionId}"}`, input.timeframe);

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
          `lagon_isolate_cpu_time{function="${input.functionId}",quantile="0.99"} * 100000`,
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
        const { result } = await prometheus(`lagon_bytes_in{function="${input.functionId}"}`, input.timeframe);

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
        const { result } = await prometheus(`lagon_bytes_out{function="${input.functionId}"}`, input.timeframe);

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
