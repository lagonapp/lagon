import { removeDeployment, setCurrentDeployment } from 'lib/api/deployments';
import prisma from 'lib/prisma';
import * as trpc from '@trpc/server';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const deploymentsRouter = () =>
  createRouter()
    .mutation('current', {
      input: z.object({
        functionId: z.string(),
        deploymentId: z.string(),
      }),
      resolve: async ({ input }) => {
        const deployment = await setCurrentDeployment(input.functionId, input.deploymentId);

        return deployment;
      },
    })
    .mutation('delete', {
      input: z.object({
        functionId: z.string(),
        deploymentId: z.string(),
      }),
      resolve: async ({ input }) => {
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
            env: {
              select: {
                key: true,
                value: true,
              },
            },
          },
        });

        if (!func) {
          throw new trpc.TRPCError({
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
      },
    });
