import { withSentry } from '@sentry/nextjs';
import { NextApiHandler } from 'next';

type ApiHandlerOptions = {
  tokenAuth?: boolean;
};

export default function apiHandler(
  nextHandler: NextApiHandler,
  options: ApiHandlerOptions = { tokenAuth: true },
): NextApiHandler {
  const { tokenAuth } = options;

  return async (request, response) => {
    if (tokenAuth) {
      if (request.headers['x-lagon-token'] !== process.env.LAGON_TOKEN) {
        return response.status(401).end();
      }
    }

    return withSentry(nextHandler)(request, response);
  };
}
