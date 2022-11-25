import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../pages/api/trpc/[trpc]';

export const trpc = createTRPCNext<AppRouter>({
  config: () => {
    if (typeof window !== 'undefined') {
      return {
        links: [
          httpBatchLink({
            url: '/api/trpc',
          }),
        ],
        queryClientConfig: {
          defaultOptions: {
            queries: {
              suspense: true,
            },
          },
        },
      };
    }

    return {
      links: [
        httpBatchLink({
          url: process.env.NEXTAUTH_URL!,
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            suspense: true,
          },
        },
      },
    };
  },
});
