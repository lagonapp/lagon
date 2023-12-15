import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth/next';
import { functionsRouter } from 'lib/trpc/functionsRouter';
import { organizationsRouter } from 'lib/trpc/organizationsRouter';
import { tokensRouter } from 'lib/trpc/tokensRouter';
import { deploymentsRouter } from 'lib/trpc/deploymentsRouter';
import prisma from 'lib/prisma';
import { Session } from 'next-auth';
import { accountsRouter } from 'lib/trpc/accountsRouter';
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../auth/[...nextauth]';
import { statsRouter } from 'lib/trpc/statsRouter';

const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions): Promise<{
  req: NextApiRequest;
  res: NextApiResponse<unknown>;
  session: Session;
}> => {
  const tokenValue = req.headers['x-lagon-token'] as string;
  const organizationId = req.headers['x-lagon-organization-id'] as string | undefined;

  // tokensAuthenticate needs to skip authentication
  if (req.query.trpc === 'tokensAuthenticate') {
    return {
      req,
      res,
      // @ts-expect-error no session for this route is used
      session: null,
    };
  }

  if (tokenValue) {
    const token = await prisma.token.findFirst({
      where: {
        value: tokenValue,
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            currentOrganizationId: true,
          },
        },
      },
    });

    if (!token) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
      });
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId?.length ? organizationId : token.user.currentOrganizationId ?? '',
      },
      select: {
        id: true,
        name: true,
        description: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCustomerId: true,
        stripeCurrentPeriodEnd: true,
        createdAt: true,
      },
    });

    return {
      req,
      res,
      session: {
        user: {
          id: token.user.id,
          name: token.user.name ?? '',
          email: token.user.email ?? '',
        },
        organization: {
          id: organization?.id ?? '',
          name: organization?.name ?? '',
          description: organization?.description ?? '',
          stripeSubscriptionId: organization?.stripeSubscriptionId ?? '',
          stripePriceId: organization?.stripePriceId ?? '',
          stripeCustomerId: organization?.stripeCustomerId ?? '',
          stripeCurrentPeriodEnd: organization?.stripeCurrentPeriodEnd ?? new Date(),
          createdAt: organization?.createdAt ?? new Date(),
        },
        expires: '',
      },
    };
  } else {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
      });
    }

    return {
      req,
      res,
      session,
    };
  }
};

const t = initTRPC.context<inferAsyncReturnType<typeof createContext>>().create();
export type T = typeof t;

const router = t.mergeRouters(
  functionsRouter(t),
  organizationsRouter(t),
  tokensRouter(t),
  deploymentsRouter(t),
  accountsRouter(t),
  statsRouter(t),
);

export type AppRouter = typeof router;

export default trpcNext.createNextApiHandler({
  router,
  createContext,
  onError: ({ error }) => {
    console.error(error);
  },
});
