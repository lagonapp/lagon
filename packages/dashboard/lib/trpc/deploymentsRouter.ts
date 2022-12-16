import { PutObjectCommand } from '@aws-sdk/client-s3';
import { TRPCError } from '@trpc/server';
import {
  createDeployment,
  unpromoteProductionDeployment,
  removeDeployment,
  promoteProductionDeployment,
} from 'lib/api/deployments';
import prisma from 'lib/prisma';
import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import redis from 'lib/redis';
import { envStringToObject, getFullCurrentDomain } from 'lib/utils';
import s3 from 'lib/s3';
import { MAX_ASSETS_PER_FUNCTION, PRESIGNED_URL_EXPIRES_SECONDS } from 'lib/constants';

export const deploymentsRouter = (t: T) =>
  t.router({
    deploymentCreate: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          assets: z.string().array(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (input.assets.length >= MAX_ASSETS_PER_FUNCTION) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `You can only upload ${MAX_ASSETS_PER_FUNCTION} assets per Function`,
          });
        }

        const func = await prisma.function.findFirst({
          where: {
            id: input.functionId as string,
          },
          select: {
            id: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            cron: true,
            cronRegion: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
          },
        });

        if (!func) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        const deployment = await createDeployment(
          {
            ...func,
            domains: func.domains.map(({ domain }) => domain),
          },
          input.assets,
          ctx.session.user.email,
        );

        const getPresignedUrl = async (key: string) => {
          const putCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
          });

          return getSignedUrl(s3, putCommand, {
            expiresIn: PRESIGNED_URL_EXPIRES_SECONDS,
          });
        };

        const codeUrl = await getPresignedUrl(`${deployment.id}.js`);
        const assetsUrls: Record<string, string> = {};

        await Promise.all(
          input.assets.map(async asset => {
            const url = await getPresignedUrl(`${deployment.id}/${asset}`);
            assetsUrls[asset] = url;
          }),
        );

        return {
          deploymentId: deployment.id,
          codeUrl,
          assetsUrls,
        };
      }),
    deploymentDeploy: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          deploymentId: z.string(),
          isProduction: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        const hasProductionDeployment = await prisma.deployment.findFirst({
          where: {
            functionId: input.functionId,
            isProduction: true,
          },
        });

        if (input.isProduction) {
          await unpromoteProductionDeployment(input.functionId);
        }

        const [func, deployment] = await Promise.all([
          prisma.function.findFirst({
            where: {
              id: input.functionId,
            },
            select: {
              id: true,
              name: true,
              domains: true,
              memory: true,
              timeout: true,
              startupTimeout: true,
              cron: true,
              cronRegion: true,
              env: true,
            },
          }),
          prisma.deployment.update({
            where: {
              id: input.deploymentId,
            },
            data: {
              isProduction: hasProductionDeployment ? input.isProduction : true,
            },
            select: {
              id: true,
              isProduction: true,
              assets: true,
            },
          }),
        ]);

        if (!func) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        await redis.publish(
          'deploy',
          JSON.stringify({
            functionId: func.id,
            functionName: func.name,
            deploymentId: deployment.id,
            domains: func.domains.map(({ domain }) => domain),
            memory: func.memory,
            timeout: func.timeout,
            startupTimeout: func.startupTimeout,
            cron: func.cron,
            cronRegion: func.cronRegion,
            env: envStringToObject(func.env),
            isProduction: deployment.isProduction,
            assets: deployment.assets.map(({ name }) => name),
          }),
        );

        return {
          url: getFullCurrentDomain({
            name: deployment.isProduction ? func.name : deployment.id,
          }),
        };
      }),
    deploymentPromote: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          deploymentId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        await promoteProductionDeployment(input.functionId, input.deploymentId);

        return { ok: true };
      }),
    deploymentDelete: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          deploymentId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const func = await prisma.function.findFirst({
          where: {
            id: input.functionId,
          },
          select: {
            id: true,
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
          },
        });

        if (!func) {
          throw new TRPCError({
            code: 'NOT_FOUND',
          });
        }

        await removeDeployment(
          {
            ...func,
            domains: func.domains.map(({ domain }) => domain),
          },
          input.deploymentId,
        );

        return { ok: true };
      }),
  });
