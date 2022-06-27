import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';

export const organizationsRouter = () =>
  createRouter().query('list', {
    resolve: async ({ ctx }) => {
      const organizations = await prisma.organization.findMany({
        where: {
          ownerId: ctx.session.user.id,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          description: true,
          ownerId: true,
        },
      });

      return organizations;
    },
  });
