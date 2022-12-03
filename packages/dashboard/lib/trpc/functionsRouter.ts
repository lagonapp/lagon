import { z } from 'zod';
import prisma from 'lib/prisma';
import { LOG_LEVELS, TIMEFRAMES } from 'lib/types';
import { getDeploymentCode, removeFunction, updateDomains } from 'lib/api/deployments';
import {
  FUNCTION_DEFAULT_MEMORY,
  FUNCTION_DEFAULT_STARTUP_TIMEOUT,
  FUNCTION_DEFAULT_TIMEOUT,
  FUNCTION_NAME_MAX_LENGTH,
  FUNCTION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { TRPCError } from '@trpc/server';
import { T } from 'pages/api/trpc/[trpc]';
import Client, { datasets } from '@axiomhq/axiom-node';

const axiomClient = new Client({
  orgId: process.env.AXIOM_ORG_ID,
  token: process.env.AXIOM_TOKEN,
});

export const functionsRouter = (t: T) =>
  t.router({
    functionsList: t.procedure.query(async ({ ctx }) => {
      const functions = await prisma.function.findMany({
        where: {
          organizationId: ctx.session.organization.id,
        },
        select: {
          id: true,
          updatedAt: true,
          name: true,
          domains: {
            select: {
              domain: true,
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
    }),
    functionGet: t.procedure
      .input(
        z.object({
          functionId: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const func = await prisma.function.findFirst({
          where: {
            organizationId: ctx.session.organization.id,
            id: input.functionId,
          },
          select: {
            id: true,
            updatedAt: true,
            createdAt: true,
            name: true,
            timeout: true,
            cron: true,
            cronRegion: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            domains: {
              select: {
                domain: true,
              },
            },
            deployments: {
              select: {
                id: true,
                createdAt: true,
                isProduction: true,
                commit: true,
                triggerer: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!func) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        return {
          ...func,
          domains: func.domains.map(({ domain }) => domain),
        };
      }),
    functionLogs: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          logLevel: z.enum(LOG_LEVELS),
          timeframe: z.enum(TIMEFRAMES),
        }),
      )
      .query(async ({ input }) => {
        const logs = await axiomClient.datasets.queryLegacy('serverless', {
          startTime: new Date(
            new Date().getTime() -
              (input.timeframe === 'Last 24 hours' ? 1 : input.timeframe === 'Last 30 days' ? 30 : 7) *
                24 *
                60 *
                60 *
                1000,
          ).toISOString(),
          endTime: new Date(Date.now()).toISOString(),
          resolution: 'auto',
          filter: {
            field: 'metadata.source',
            op: datasets.FilterOp.Equal,
            value: 'console',
            children: [
              {
                field: 'metadata.function',
                op: datasets.FilterOp.Equal,
                value: input.functionId,
              },
            ],
          },
          order: [
            {
              field: '_time',
              desc: true,
            },
          ],
        });

        return (
          (logs.matches?.map(({ _time, data }) => ({
            ...data,
            time: _time,
          })) as { time: string; level: string; message: string }[]) || []
        );
      }),
    functionCode: t.procedure
      .input(
        z.object({
          functionId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        const deployment = await prisma.deployment.findFirst({
          where: {
            functionId: input.functionId,
            isProduction: true,
          },
          select: {
            id: true,
          },
        });

        if (!deployment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        const code = await getDeploymentCode(deployment.id);

        return { code };
      }),
    functionCreate: t.procedure
      .input(
        z.object({
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
      )
      .mutation(async ({ ctx, input }) => {
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
            memory: FUNCTION_DEFAULT_MEMORY,
            timeout: FUNCTION_DEFAULT_TIMEOUT,
            startupTimeout: FUNCTION_DEFAULT_STARTUP_TIMEOUT,
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
          },
        });
      }),
    functionUpdate: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          name: z.string().min(FUNCTION_NAME_MIN_LENGTH).max(FUNCTION_NAME_MAX_LENGTH),
          domains: z.string().array(),
          cron: z.string().nullable(),
          cronRegion: z.string(),
          env: z
            .object({
              key: z.string(),
              value: z.string(),
            })
            .array(),
        }),
      )
      .mutation(async ({ input }) => {
        const currentFunction = await prisma.function.findFirst({
          where: {
            id: input.functionId,
          },
          select: {
            domains: {
              select: {
                domain: true,
              },
            },
          },
        });

        if (!currentFunction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        await prisma.domain.deleteMany({
          where: {
            functionId: input.functionId,
          },
        });

        await prisma.domain.createMany({
          data: input.domains.map(domain => ({
            functionId: input.functionId,
            domain,
          })),
        });

        const func = await prisma.function.update({
          where: {
            id: input.functionId,
          },
          data: {
            name: input.name,
            cron: input.cron,
            cronRegion: input.cronRegion,
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
            startupTimeout: true,
            cron: true,
            cronRegion: true,
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
                isProduction: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        const currentDomains = currentFunction.domains.map(({ domain }) => domain);
        const newDomains = func.domains.map(({ domain }) => domain);

        if (currentDomains !== newDomains) {
          const deployment = func.deployments.find(deployment => deployment.isProduction)!;

          await updateDomains(
            {
              ...func,
              domains: newDomains,
            },
            {
              ...deployment,
              assets: deployment.assets.map(({ name }) => name),
            },
            currentDomains,
          );
        }

        return { ok: true };
      }),
    functionDelete: t.procedure
      .input(
        z.object({
          functionId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
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
            startupTimeout: true,
            cron: true,
            cronRegion: true,
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
                isProduction: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        if (!func) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        await removeFunction(func);

        return { ok: true };
      }),
  });
