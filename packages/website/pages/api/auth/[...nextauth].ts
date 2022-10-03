import NextAuth, { Session, NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from 'lib/prisma';
import apiHandler from 'lib/api';
import * as Sentry from '@sentry/nextjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    session: async ({ session, token }) => {
      const userFromDB = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
        select: {
          id: true,
          name: true,
          email: true,
          currentOrganizationId: true,
        },
      });

      if (!userFromDB) {
        throw new Error('User not found');
      }

      const organization = await prisma.organization.findFirst({
        where: {
          id: userFromDB.currentOrganizationId!,
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      Sentry.setUser({
        id: userFromDB.id,
        username: userFromDB.name!,
        email: userFromDB.email!,
      });

      return {
        ...session,
        user: {
          id: userFromDB.id,
          name: userFromDB.name,
          email: userFromDB.email,
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
};

export default apiHandler(NextAuth(authOptions), { tokenAuth: false });
