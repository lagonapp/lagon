import { TRPCError } from '@trpc/server';
import prisma from 'lib/prisma';

export async function checkCanDeleteToken({ tokenId, userId }: { tokenId: string; userId: string }) {
  const token = await prisma.token.count({
    where: {
      id: tokenId,
      userId,
    },
  });

  if (token === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
}
