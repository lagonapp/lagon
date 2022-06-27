import { z } from 'zod';
import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';

export const functionsRouter = () =>
  createRouter()
    .query('list', {
      input: z.object({
        organizationId: z.string(),
      }),
      resolve: async ({ input }) => {
        const functions = await prisma.function.findMany({
          where: {
            organizationId: input.organizationId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: true,
            memory: true,
            timeout: true,
            env: true,
            cron: true,
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return functions;
      },
    })
    .query('get', {
      input: z.object({
        organizationId: z.string(),
        functionId: z.string(),
      }),
      resolve: async ({ input }) => {
        const func = await prisma.function.findFirst({
          where: {
            organizationId: input.organizationId,
            id: input.functionId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: true,
            memory: true,
            timeout: true,
            env: true,
            cron: true,
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        return func;
      },
    });
