import type { AppRouter } from '../../website/pages/api/trpc/[trpc]';
import { createTRPCClient } from '@trpc/client';
import { API_URL } from './utils/constants';
import fetch from 'node-fetch';

export const trpc = (authToken: string) => {
  return createTRPCClient<AppRouter>({
    url: `${API_URL}/trpc`,
    // @ts-expect-error node-fetch signature is a bit different
    fetch,
    headers: {
      'x-lagon-token': authToken,
    },
  });
};
