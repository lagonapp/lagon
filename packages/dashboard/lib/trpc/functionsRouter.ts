import { z } from 'zod';
import prisma from 'lib/prisma';
import { TIMEFRAMES } from 'lib/types';
import { getDeploymentCode, removeFunction, redeploy } from 'lib/api/deployments';
import {
  CUSTOM_DOMAINS_PER_FUNCTION,
  ENVIRONMENT_VARIABLES_PER_FUNCTION,
  ENVIRONMENT_VARIABLE_KEY_MAX_LENGTH,
  ENVIRONMENT_VARIABLE_VALUE_MAX_SIZE,
  FUNCTION_DEFAULT_MEMORY,
  FUNCTION_DEFAULT_STARTUP_TIMEOUT,
  FUNCTION_DEFAULT_TIMEOUT,
  FUNCTION_NAME_MAX_LENGTH,
  FUNCTION_NAME_MIN_LENGTH,
  MAX_FUNCTIONS_PER_ORGANIZATION,
} from 'lib/constants';
import { LOG_LEVELS } from '@lagon/ui';
import { TRPCError } from '@trpc/server';
import { T } from 'pages/api/trpc/[trpc]';
import Client from '@axiomhq/axiom-node';
import { findUniqueFunctionName, isFunctionNameUnique } from 'lib/api/functions';

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
        const logs = await axiomClient.datasets.query(
          `['serverless'] | where ['metadata.source'] == 'console' and ['metadata.function'] == '${input.functionId}' | sort by _time`,
          {
            startTime: new Date(
              new Date().getTime() -
                (input.timeframe === 'Last 24 hours' ? 1 : input.timeframe === 'Last 30 days' ? 30 : 7) *
                  24 *
                  60 *
                  60 *
                  1000,
            ).toISOString(),
            endTime: new Date(Date.now()).toISOString(),
            noCache: false,
            streamingDuration: '',
          },
        );

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
          name: z.string().optional(),
          domains: z.string().array().max(CUSTOM_DOMAINS_PER_FUNCTION),
          env: z
            .object({
              key: z.string().max(ENVIRONMENT_VARIABLE_KEY_MAX_LENGTH),
              value: z.string().max(ENVIRONMENT_VARIABLE_VALUE_MAX_SIZE),
            })
            .array()
            .max(ENVIRONMENT_VARIABLES_PER_FUNCTION),
          cron: z.string().nullable(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (input.name) {
          if (!isFunctionNameUnique(input.name)) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A Function with the same name already exists',
            });
          }
        }

        const name = input.name || (await findUniqueFunctionName());

        const functions = await prisma.function.count({
          where: {
            organizationId: ctx.session.organization.id,
          },
        });

        if (functions >= MAX_FUNCTIONS_PER_ORGANIZATION) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `You can only have ${MAX_FUNCTIONS_PER_ORGANIZATION} Functions per Organization`,
          });
        }

        return prisma.function.create({
          data: {
            organizationId: ctx.session.organization.id,
            name,
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
          name: z.string().min(FUNCTION_NAME_MIN_LENGTH).max(FUNCTION_NAME_MAX_LENGTH).optional(),
          domains: z.string().array().max(CUSTOM_DOMAINS_PER_FUNCTION).optional(),
          cron: z.string().nullable().optional(),
          cronRegion: z.string().optional(),
          env: z
            .object({
              key: z.string().max(ENVIRONMENT_VARIABLE_KEY_MAX_LENGTH),
              value: z.string().max(ENVIRONMENT_VARIABLE_VALUE_MAX_SIZE),
            })
            .array()
            .max(ENVIRONMENT_VARIABLES_PER_FUNCTION)
            .optional(),
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

        if (input.domains) {
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
        }

        if (input.env) {
          await prisma.envVariable.deleteMany({
            where: {
              functionId: input.functionId,
            },
          });

          await prisma.envVariable.createMany({
            data: input.env.map(({ key, value }) => ({
              functionId: input.functionId,
              key,
              value,
            })),
          });
        }

        if (input.name) {
          const isUnique = await isFunctionNameUnique(input.name);

          if (!isUnique) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A Function with the same name already exists',
            });
          }

          await prisma.function.update({
            where: {
              id: input.functionId,
            },
            data: {
              name: input.name,
            },
          });
        }

        // undefined means we don't want to update the field
        // null means we want to clear it
        if (input.cron !== undefined) {
          await prisma.function.update({
            where: {
              id: input.functionId,
            },
            data: {
              cron: input.cron,
            },
          });
        }

        if (input.cronRegion) {
          await prisma.function.update({
            where: {
              id: input.functionId,
            },
            data: {
              cronRegion: input.cronRegion,
            },
          });
        }

        const oldDomains = func.domains.map(({ domain }) => domain);
        const deployment = func.deployments.find(deployment => deployment.isProduction);

        if (deployment) {
          await redeploy(
            {
              ...func,
              name: input.name || func.name,
              env: input.env || func.env,
              cron: input.cron !== undefined ? input.cron : func.cron,
              cronRegion: input.cronRegion || func.cronRegion,
              domains: input.domains || oldDomains,
            },
            {
              ...deployment,
              assets: deployment.assets.map(({ name }) => name),
            },
            oldDomains,
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
