import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';
import { functionsRouter } from 'lib/trpc/functionsRouter';
import { organizationsRouter } from 'lib/trpc/organizationsRouter';
import { tokensRouter } from 'lib/trpc/tokensRouter';
import { deploymentsRouter } from 'lib/trpc/deploymentsRouter';
import prisma from 'lib/prisma';
import { Session } from 'next-auth';

const createContext = async ({ req, res }: trpcNext.CreateNextContextOptions) => {
  const tokenValue = req.headers['x-lagon-token'] as string;

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
      res.status(401).end();
      return;
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
    const session = await getSession({ req });

    if (!session) {
      res.status(401).end();
      return;
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
  .merge('deployments.', deploymentsRouter());

export type AppRouter = typeof router;

export default trpcNext.createNextApiHandler({
  router,
  createContext,
});
