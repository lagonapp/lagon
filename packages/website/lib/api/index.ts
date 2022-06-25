import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { withSentry } from '@sentry/nextjs';
import prisma from 'lib/prisma';
import { NextApiHandler, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export function handlePrismaError(error: any, response: NextApiResponse) {
  if (error instanceof PrismaClientKnownRequestError) {
    let errorMessage = 'An error occured.';

    switch (error.code) {
      case 'P2002':
        errorMessage = `'${error.meta.target[0]}' already exists and should be unique.`;
        break;
      default:
        break;
    }

    response.status(500).json({
      error: errorMessage,
    });

    return;
  }

  response.status(500).json({
    error: 'An error occurred.',
  });
}

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
