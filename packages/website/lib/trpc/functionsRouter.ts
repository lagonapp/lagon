import { z } from 'zod';
import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { LOG_LEVELS, TIMEFRAMES } from 'lib/types';
import { ClickHouse } from 'clickhouse';
import { getDeploymentCode } from 'lib/api/deployments';

const clickhouse = new ClickHouse({});

export const functionsRouter = () =>
  createRouter()
    .query('list', {
      resolve: async ({ ctx }) => {
        const functions = await prisma.function.findMany({
          where: {
            organizationId: ctx.session.organization.id,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: true,
            memory: true,
            timeout: true,
            env: true,
            cron: true,
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return functions;
      },
    })
    .query('get', {
      input: z.object({
        functionId: z.string(),
      }),
      resolve: async ({ ctx, input }) => {
        const func = await prisma.function.findFirst({
          where: {
            organizationId: ctx.session.organization.id,
            id: input.functionId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: true,
            memory: true,
            timeout: true,
            env: true,
            cron: true,
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        return func;
      },
    })
    .query('logs', {
      input: z.object({
        functionId: z.string(),
        logLevel: z.enum(LOG_LEVELS),
        timeframe: z.enum(TIMEFRAMES),
      }),
      resolve: async ({ input }) => {
        if (input.timeframe === 'Last 24 hours') {
          const result = await clickhouse
            .query(
              `select * from logs where functionId='${input.functionId}' ${
                input.logLevel === 'all' ? '' : `and level='${input.logLevel}'`
              } and date >= subtractHours(now(), 24) order by date desc;`,
            )
            .toPromise();

          return result;
        } else {
          const result = await clickhouse
            .query(
              `select * from logs where functionId='${input.functionId}' ${
                input.logLevel === 'all' ? '' : `and level='${input.logLevel}'`
              } and date >= subtractDays(now(), ${input.timeframe === 'Last 30 days' ? 30 : 7}) order by date desc;`,
            )
            .toPromise();

          return result;
        }
      },
    })
    .query('code', {
      input: z.object({
        functionId: z.string(),
      }),
      resolve: async ({ input }) => {
        const deployment = await prisma.deployment.findFirst({
          where: {
            functionId: input.functionId,
            isCurrent: true,
          },
          select: {
            id: true,
          },
        });

        const code = await getDeploymentCode(deployment.id);

        return { code };
      },
    })
    .query('stats', {
      input: z.object({
        functionId: z.string(),
        timeframe: z.enum(TIMEFRAMES),
      }),
      resolve: async ({ input }) => {
        if (input.timeframe === 'Last 24 hours') {
          const result = await clickhouse
            .query(
              `select toStartOfHour(date), sum(requests), avg(memory), avg(cpuTime), sum(receivedBytes), sum(sendBytes) from functions_result where functionId='${input.functionId}' and date >= subtractHours(now(), 24) group by toStartOfHour(date)`,
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

          return stats;
        } else {
          const result = await clickhouse
            .query(
              `select toStartOfDay(date), sum(requests), avg(memory), avg(cpuTime), sum(receivedBytes), sum(sendBytes) from functions_result where functionId='${
                input.functionId
              }' and date >= subtractDays(now(), ${
                input.timeframe === 'Last 30 days' ? 30 : 7
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

          return stats;
        }
      },
    });
