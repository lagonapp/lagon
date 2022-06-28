import { createDeployment, removeCurrentDeployment, removeDeployment, setCurrentDeployment } from 'lib/api/deployments';
import prisma from 'lib/prisma';
import * as trpc from '@trpc/server';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const deploymentsRouter = () =>
  createRouter()
    .mutation('create', {
      input: z.object({
        functionId: z.string(),
        code: z.string(),
        assets: z
          .object({
            name: z.string(),
            content: z.string(),
          })
          .array(),
        shouldTransformCode: z.boolean(),
      }),
      resolve: async ({ ctx, input }) => {
        const func = await prisma.function.findFirst({
          where: {
            id: input.functionId,
          },
          select: {
            id: true,
            name: true,
            domains: true,
            memory: true,
            timeout: true,
            env: true,
          },
        });

        if (!func) {
          throw new trpc.TRPCError({
            code: 'NOT_FOUND',
          });
        }

        await removeCurrentDeployment(func.id);

        return createDeployment(func, input.code, input.assets, input.shouldTransformCode, ctx.session.user.email);
      },
    })
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
            domains: true,
            memory: true,
            timeout: true,
            env: true,
          },
        });

        if (!func) {
          throw new trpc.TRPCError({
            code: 'NOT_FOUND',
          });
        }

        return removeDeployment(func, input.deploymentId);
      },
    });
