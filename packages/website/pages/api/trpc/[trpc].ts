import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';
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

const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions): Promise<{
  req: NextApiRequest;
  res: NextApiResponse<any>;
  session: Session;
}> => {
  const tokenValue = req.headers['x-lagon-token'] as string;

  // tokens.authenticaton needs to skip authentication
  if (req.query.trpc === 'tokens.authenticate') {
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
      throw new trpc.TRPCError({
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
      throw new trpc.TRPCError({
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

export const createRouter = () => trpc.router<trpc.inferAsyncReturnType<typeof createContext>>();

const router = createRouter()
  .merge('functions.', functionsRouter())
  .merge('organizations.', organizationsRouter())
  .merge('tokens.', tokensRouter())
  .merge('deployments.', deploymentsRouter())
  .merge('accounts.', accountsRouter());

export type AppRouter = typeof router;

export default trpcNext.createNextApiHandler({
  router,
  createContext,
  onError: ({ error }) => Sentry.captureException(error),
});
