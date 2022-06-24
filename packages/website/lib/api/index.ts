import { withSentry } from '@sentry/nextjs';
import prisma from 'lib/prisma';
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
      const tokenValue = request.headers['x-lagon-token'] as string;

      if (tokenValue) {
        const token = await prisma.token.findFirst({
          where: {
            value: tokenValue,
          },
          select: {
            user: true,
          },
        });

        if (!token) {
          response.status(401).end();
          return;
        }

        request.user = token.user;
      } else {
        const session = await getSession({ req: request });

        if (!session) {
          response.status(401).end();
          return;
        }

        request.user = session.user;
      }
    } else if (tokenAuth) {
      if (request.headers['x-lagon-token'] !== process.env.LAGON_TOKEN) {
        return response.status(401).end();
      }
    }

    return withSentry(nextHandler)(request, response);
  };
}
