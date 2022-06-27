import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getSession } from 'next-auth/react';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { IncomingMessage, OutgoingMessage } from 'node:http';
import { functionsRouter } from 'lib/trpc/functionsRouter';
import { organizationsRouter } from 'lib/trpc/organizationsRouter';

const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions | NodeHTTPCreateContextFnOptions<IncomingMessage, OutgoingMessage>) => {
  const session = await getSession({ req });

  return {
    req,
    res,
    session,
  };
};

export const createRouter = () => trpc.router<trpc.inferAsyncReturnType<typeof createContext>>();

const router = createRouter().merge('functions.', functionsRouter()).merge('organizations.', organizationsRouter());

export type AppRouter = typeof router;

export default trpcNext.createNextApiHandler({
  router,
  createContext,
});
