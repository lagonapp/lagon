import { withSentry } from '@sentry/nextjs';
import { NextApiHandler } from 'next';

export default function apiHandler(nextHandler: NextApiHandler): NextApiHandler {
  return async (request, response) => {
    if (request.headers['x-lagon-token'] !== process.env.LAGON_TOKEN) {
      return response.status(401).end();
    }

    return withSentry(nextHandler)(request, response);
  };
}
