import { withSentry } from '@sentry/nextjs';
import { NextApiHandler } from 'next';
import { getSession } from 'next-auth/react';

type ApiHandlerOptions = {
  auth?: boolean;
  tokenAuth?: boolean;
};

export default function apiHandler(
  nextHandler: NextApiHandler,
  options: ApiHandlerOptions = { auth: true, tokenAuth: false },
): NextApiHandler {
  const { auth, tokenAuth } = options;

  return async (request, response) => {
    if (auth) {
      const session = await getSession({ req: request });

      if (!session) {
        response.status(401).end();
        return;
      }

      request.session = session;
    } else if (tokenAuth) {
      if (request.headers['x-lagon-token'] !== process.env.LAGON_TOKEN) {
        return response.status(401).end();
      }
    }

    return withSentry(nextHandler)(request, response);
  };
}
