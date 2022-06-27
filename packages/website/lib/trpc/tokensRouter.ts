import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';

export const tokensRouter = () =>
  createRouter().query('verification-code', {
    resolve: async ({ ctx }) => {
      const user = await prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          id: true,
          verificationCode: true,
        },
      });

      let verificationCode: string | null = user.verificationCode;

      if (!verificationCode) {
        verificationCode = (
          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              verificationCode:
                Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            },
          })
        ).verificationCode;
      }

      return { code: verificationCode };
    },
  });
