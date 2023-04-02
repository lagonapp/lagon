import { z } from 'zod';
import prisma from 'lib/prisma';
import { TIMEFRAMES } from 'lib/types';
import { getDeploymentCode, removeFunction, redeploy } from 'lib/api/deployments';
import {
  CUSTOM_DOMAINS_PER_FUNCTION,
  ENVIRONMENT_VARIABLES_PER_FUNCTION,
  ENVIRONMENT_VARIABLE_KEY_MAX_LENGTH,
  ENVIRONMENT_VARIABLE_VALUE_MAX_SIZE,
  FUNCTION_MEMORY,
  FUNCTION_NAME_MAX_LENGTH,
  FUNCTION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { LOG_LEVELS } from '@lagon/ui';
import { TRPCError } from '@trpc/server';
import { T } from 'pages/api/trpc/[trpc]';
import {
  checkCanCreateFunction,
  checkCanQueryFunction,
  findUniqueFunctionName,
  isFunctionNameBlacklisted,
  isFunctionNameUnique,
} from 'lib/api/functions';
import { getPlanFromPriceId } from 'lib/plans';
import { checkIsOrganizationOwner } from 'lib/api/organizations';
import clickhouse from 'lib/clickhouse';

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
          cron: true,
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
        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

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
      .query(async ({ input, ctx }) => {
        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

        const result = (await clickhouse
          .query(
            `SELECT
  level,
  message,
  timestamp
FROM serverless.logs
WHERE
  function_id = '${input.functionId}'
AND
  timestamp >= toDateTime(now() - INTERVAL ${
    input.timeframe === 'Last 24 hours' ? 1 : input.timeframe === 'Last 30 days' ? 30 : 7
  } DAY)
${input.logLevel !== 'all' ? `AND level = '${input.logLevel}'` : ''}
ORDER BY timestamp DESC`,
          )
          .toPromise()) as { level: string; message: string; timestamp: string }[];

        return result;
      }),
    functionCode: t.procedure
      .input(
        z.object({
          functionId: z.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

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
        const plan = getPlanFromPriceId({
          priceId: ctx.session.organization.stripePriceId,
          currentPeriodEnd: ctx.session.organization.stripeCurrentPeriodEnd,
        });

        await checkCanCreateFunction({
          functionName: input.name,
          ownerId: ctx.session.user.id,
          plan,
        });

        const name = input.name || (await findUniqueFunctionName());
        const isUnique = await isFunctionNameUnique(name);

        if (!isUnique) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A Function with the same name already exists',
          });
        }

        if (isFunctionNameBlacklisted(name)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Function name "${name}" is not allowed`,
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
            memory: FUNCTION_MEMORY,
            timeout: plan.cpuTime,
            startupTimeout: plan.startupTime,
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
      .mutation(async ({ input, ctx }) => {
        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

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

          if (isFunctionNameBlacklisted(input.name)) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Function name "${input.name}" is not allowed`,
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
      .mutation(async ({ input, ctx }) => {
        await checkIsOrganizationOwner({
          organizationId: ctx.session.organization.id,
          ownerId: ctx.session.user.id,
        });

        await checkCanQueryFunction({
          functionId: input.functionId,
          ownerId: ctx.session.user.id,
        });

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
