import prisma from 'lib/prisma';
import { t } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const accountsRouter = t.router({
  accountUpdate: t.procedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
});
