import { z } from 'zod';
import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { LogLevel, LOG_LEVELS, TIMEFRAMES } from 'lib/types';
import { ClickHouse } from 'clickhouse';
import { getDeploymentCode, removeDeployment } from 'lib/api/deployments';
import { DEFAULT_MEMORY, DEFAULT_TIMEOUT, FUNCTION_NAME_MAX_LENGTH, FUNCTION_NAME_MIN_LENGTH } from 'lib/constants';
import * as trpc from '@trpc/server';

const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL,
});

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
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            cron: true,
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return functions.map(func => ({
          ...func,
          domains: func.domains.map(({ domain }) => domain),
        }));
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
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            cron: true,
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!func) {
          throw new trpc.TRPCError({
            code: 'NOT_FOUND',
          });
        }

        return {
          ...func,
          domains: func.domains.map(({ domain }) => domain),
        };
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
          return (await clickhouse
            .query(
              `select * from logs where functionId='${input.functionId}' ${
                input.logLevel === 'all' ? '' : `and level='${input.logLevel}'`
              } and date >= subtractHours(now(), 24) order by date desc;`,
            )
            .toPromise()) as {
            date: string;
            level: LogLevel;
            message: string;
          }[];
        } else {
          return (await clickhouse
            .query(
              `select * from logs where functionId='${input.functionId}' ${
                input.logLevel === 'all' ? '' : `and level='${input.logLevel}'`
              } and date >= subtractDays(now(), ${input.timeframe === 'Last 30 days' ? 30 : 7}) order by date desc;`,
            )
            .toPromise()) as {
            date: string;
            level: LogLevel;
            message: string;
          }[];
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

        if (!deployment) {
          throw new trpc.TRPCError({
            code: 'NOT_FOUND',
          });
        }

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
          const result = (await clickhouse
            .query(
              `select toStartOfHour(date), sum(requests), avg(memory), avg(cpuTime), sum(receivedBytes), sum(sendBytes) from functions_result where functionId='${input.functionId}' and date >= subtractHours(now(), 24) group by toStartOfHour(date)`,
            )
            .toPromise()) as Record<string, number>[];

          return result.map(record => {
            return {
              date: record['toStartOfHour(date)'],
              requests: record['sum(requests)'],
              memory: record['avg(memory)'],
              cpu: record['avg(cpuTime)'],
              receivedBytes: record['sum(receivedBytes)'],
              sendBytes: record['sum(sendBytes)'],
            };
          });
        } else {
          const result = (await clickhouse
            .query(
              `select toStartOfDay(date), sum(requests), avg(memory), avg(cpuTime), sum(receivedBytes), sum(sendBytes) from functions_result where functionId='${
                input.functionId
              }' and date >= subtractDays(now(), ${
                input.timeframe === 'Last 30 days' ? 30 : 7
              }) group by toStartOfDay(date)`,
            )
            .toPromise()) as Record<string, number>[];

          return result.map(record => {
            return {
              date: record['toStartOfDay(date)'],
              requests: record['sum(requests)'],
              memory: record['avg(memory)'],
              cpu: record['avg(cpuTime)'],
              receivedBytes: record['sum(receivedBytes)'],
              sendBytes: record['sum(sendBytes)'],
            };
          });
        }
      },
    })
    .mutation('create', {
      input: z.object({
        name: z.string(),
        domains: z.string().array(),
        env: z
          .object({
            key: z.string(),
            value: z.string(),
          })
          .array(),
        cron: z.string().nullable(),
      }),
      resolve: async ({ ctx, input }) => {
        return prisma.function.create({
          data: {
            organizationId: ctx.session.organization.id,
            name: input.name,
            domains: {
              createMany: {
                data: input.domains.map(domain => ({
                  domain,
                })),
              },
            },
            memory: DEFAULT_MEMORY,
            timeout: DEFAULT_TIMEOUT,
            env: {
              createMany: {
                data: input.env.map(({ key, value }) => ({
                  key,
                  value,
                })),
              },
            },
            cron: input.cron,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            cron: true,
          },
        });
      },
    })
    .mutation('update', {
      input: z.object({
        functionId: z.string(),
        name: z.string().min(FUNCTION_NAME_MIN_LENGTH).max(FUNCTION_NAME_MAX_LENGTH),
        domains: z.string().array(),
        cron: z.string().nullable(),
        env: z
          .object({
            key: z.string(),
            value: z.string(),
          })
          .array(),
      }),
      resolve: async ({ input }) => {
        return prisma.function.update({
          where: {
            id: input.functionId,
          },
          data: {
            name: input.name,
            domains: {
              createMany: {
                data: input.domains.map(domain => ({
                  domain,
                })),
              },
            },
            cron: input.cron,
            env: {
              createMany: {
                data: input.env.map(({ key, value }) => ({
                  key,
                  value,
                })),
              },
            },
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            cron: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });
      },
    })
    .mutation('delete', {
      input: z.object({
        functionId: z.string(),
      }),
      resolve: async ({ input }) => {
        const func = await prisma.function.findFirst({
          where: {
            id: input.functionId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        if (!func) {
          throw new trpc.TRPCError({
            code: 'NOT_FOUND',
          });
        }

        for (const deployment of func.deployments) {
          await removeDeployment(
            {
              ...func,
              domains: func.domains.map(({ domain }) => domain),
            },
            deployment.id,
          );
        }

        await clickhouse.query(`alter table functions_result delete where functionId='${func.id}'`).toPromise();
        await clickhouse.query(`alter table logs delete where functionId='${func.id}'`).toPromise();

        await prisma.function.delete({
          where: {
            id: func.id,
          },
        });

        return func;
      },
    });
