import { PutObjectCommand } from '@aws-sdk/client-s3';
import { TRPCError } from '@trpc/server';
import { createDeployment, removeDeployment, setCurrentDeployment } from 'lib/api/deployments';
import prisma from 'lib/prisma';
import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
        // return setCurrentDeployment(input.functionId, input.deploymentId);
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
          return new TRPCError({
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

          // @ts-expect-error s3 type error
          return getSignedUrl(s3, putCommand, {
            expiresIn: 3600,
          });
        };

        const codeUrl = await getPresignedUrl(`${deployment.id}.js`);
        const assetsUrls: Record<string, string> = {};

        for (const asset of input.assets) {
          assetsUrls[asset] = await getPresignedUrl(`${deployment.id}/${asset}`);
        }

        return {
          deploymentId: deployment.id,
          codeUrl,
          assetsUrls,
        };
      }),
    deploymentCurrent: t.procedure
      .input(
        z.object({
          functionId: z.string(),
          deploymentId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        return setCurrentDeployment(input.functionId, input.deploymentId);
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

        return removeDeployment(
          {
            ...func,
            domains: func.domains.map(({ domain }) => domain),
          },
          input.deploymentId,
        );
      }),
  });
