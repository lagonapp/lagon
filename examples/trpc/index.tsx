import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router';

export function handler(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: request,
    router: appRouter,
    createContext: ({ req }) => ({ req }),
  });
}
