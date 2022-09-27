import prisma from 'lib/prisma';
import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const tokensRouter = (t: T) =>
  t.router({
    tokensList: t.procedure.query(async ({ ctx }) => {
      return prisma.token.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
    tokensVerificationCode: t.procedure.query(async ({ ctx }) => {
      const user = await prisma.user.findFirst({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          id: true,
          verificationCode: true,
        },
      });

      if (!user) {
        return new TRPCError({
          code: 'NOT_FOUND',
        });
      }

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
    }),
    tokensAuthenticate: t.procedure
      .input(
        z.object({
          code: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        const user = await prisma.user.findFirst({
          where: {
            verificationCode: input.code,
          },
          select: {
            id: true,
          },
        });

        if (!user) {
          return { error: 'Invalid verification code' };
        }

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            verificationCode: null,
          },
        });

        let token = await prisma.token.findFirst({
          where: {
            userId: user.id,
          },
          select: {
            value: true,
          },
        });

        if (!token) {
          token = await prisma.token.create({
            data: {
              value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
              userId: user.id,
            },
            select: {
              value: true,
            },
          });
        }

        return { token: token.value };
      }),
    tokensDelete: t.procedure
      .input(
        z.object({
          tokenId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        return prisma.token.delete({
          where: {
            id: input.tokenId,
          },
        });
      }),
  });
