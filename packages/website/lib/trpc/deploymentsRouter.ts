import { TRPCError } from '@trpc/server';
import { removeDeployment, setCurrentDeployment } from 'lib/api/deployments';
import prisma from 'lib/prisma';
import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const deploymentsRouter = (t: T) =>
  t.router({
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
