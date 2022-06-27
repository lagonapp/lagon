import { createDeployment, removeCurrentDeployment, removeDeployment, setCurrentDeployment } from 'lib/api/deployments';
import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const deploymentsRouter = () =>
  createRouter()
    .mutation('create', {
      input: z.object({
        functionId: z.string(),
        code: z.string(),
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

        await removeCurrentDeployment(func.id);

        const deployment = await createDeployment(func, input.code, input.shouldTransformCode, ctx.session.user.email);

        return deployment;
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

        const deployment = await removeDeployment(func, input.deploymentId);

        return deployment;
      },
    });
