import { withSentry } from '@sentry/nextjs';
import { NextApiHandler } from 'next';

export default function apiHandler(nextHandler: NextApiHandler): NextApiHandler {
  return async (request, response) => withSentry(nextHandler)(request, response);
}
