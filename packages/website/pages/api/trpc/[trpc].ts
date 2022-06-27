import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';
import { functionsRouter } from 'lib/trpc/functionsRouter';
import { organizationsRouter } from 'lib/trpc/organizationsRouter';
import { tokensRouter } from 'lib/trpc/tokensRouter';
import { deploymentsRouter } from 'lib/trpc/deploymentsRouter';
import { Session } from 'next-auth';

const createContext = async ({ req, res }: trpcNext.CreateNextContextOptions) => {
  const session = (await getSession({ req })) as unknown as Session;

  return {
    req,
    res,
    session,
  };
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
