import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const accountsRouter = () =>
  createRouter().mutation('update', {
    input: z.object({
      name: z.string(),
      email: z.string(),
    }),
    resolve: async ({ ctx, input }) => {
      return prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          email: input.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    },
  });
