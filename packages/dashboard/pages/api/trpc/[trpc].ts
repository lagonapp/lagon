import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { unstable_getServerSession } from 'next-auth/next';
import { functionsRouter } from 'lib/trpc/functionsRouter';
import { organizationsRouter } from 'lib/trpc/organizationsRouter';
import { tokensRouter } from 'lib/trpc/tokensRouter';
import { deploymentsRouter } from 'lib/trpc/deploymentsRouter';
import prisma from 'lib/prisma';
import { Session } from 'next-auth';
import * as Sentry from '@sentry/nextjs';
import { accountsRouter } from 'lib/trpc/accountsRouter';
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { statsRouter } from 'lib/trpc/statsRouter';

const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions): Promise<{
  req: NextApiRequest;
  res: NextApiResponse<any>;
  session: Session;
}> => {
  const tokenValue = req.headers['x-lagon-token'] as string;

  // tokensAuthenticate needs to skip authentication
  if (req.query.trpc === 'tokensAuthenticate') {
    return {
      req,
      res,
      // @ts-expect-error no session for this route is used
      session: null,
    };
  }

  if (tokenValue) {
    const token = await prisma.token.findFirst({
      where: {
        value: tokenValue,
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            currentOrganizationId: true,
          },
        },
      },
    });

    if (!token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
      });
    }

    return {
      req,
      res,
      session: {
        user: {
          id: token.user.id,
          email: token.user.email,
        },
        organization: {
          id: token.user.currentOrganizationId,
        },
      } as Session,
    };
  } else {
    const session = await unstable_getServerSession(req, res, authOptions);

    if (!session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
      });
    }

    return {
      req,
      res,
      session,
    };
  }
};

const t = initTRPC.context<inferAsyncReturnType<typeof createContext>>().create();
export type T = typeof t;

const router = t.mergeRouters(
  functionsRouter(t),
  organizationsRouter(t),
  tokensRouter(t),
  deploymentsRouter(t),
  accountsRouter(t),
  statsRouter(t),
);

export type AppRouter = typeof router;

export default trpcNext.createNextApiHandler({
  router,
  createContext,
  onError: ({ error }) => Sentry.captureException(error),
});
