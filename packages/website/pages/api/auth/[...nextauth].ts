import NextAuth, { Session } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from 'lib/prisma';
import apiHandler from 'lib/api';
import * as Sentry from '@sentry/nextjs';

export default apiHandler(
  NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: 'database',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
      session: async ({ session, user }) => {
        const userFromDB = await prisma.user.findFirst({
          where: {
            id: user.id,
          },
          select: {
            currentOrganizationId: true,
          },
        });

        const organization = await prisma.organization.findFirst({
          where: {
            id: userFromDB?.currentOrganizationId || '',
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
        });

        Sentry.setUser({
          username: user.name || 'None',
          id: user.id,
          email: user.email || 'None',
        });

        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
          },
          organization,
        } as Session;
      },
    },
    events: {
      createUser: async ({ user }) => {
        const name = user.name || user.email;

        const { id } = await prisma.organization.create({
          data: {
            // Email address is always returned for GitHub provider
            // https://next-auth.js.org/providers/github#example
            name: user.name || (user.email as string),
            description: `${name}'s default organization.`,
            ownerId: user.id,
          },
          select: {
            id: true,
          },
        });

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            currentOrganizationId: id,
          },
        });
      },
    },
  }),
  { tokenAuth: false },
);
