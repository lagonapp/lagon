import { ClickHouse } from 'clickhouse';
import { removeDeployment } from 'lib/api/deployments';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import prisma from 'lib/prisma';
import { createRouter } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL,
});

export const organizationsRouter = () =>
  createRouter()
    .query('list', {
      resolve: async ({ ctx }) => {
        return prisma.organization.findMany({
          where: {
            ownerId: ctx.session.user.id,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            description: true,
            ownerId: true,
          },
        });
      },
    })
    .mutation('create', {
      input: z.object({
        name: z.string(),
        description: z.string(),
      }),
      resolve: async ({ ctx, input }) => {
        const organization = await prisma.organization.create({
          data: {
            name: input.name,
            description: input.description,
            ownerId: ctx.session.user.id,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            description: true,
            ownerId: true,
          },
        });

        await prisma.user.update({
          where: {
            id: ctx.session.user.id,
          },
          data: {
            currentOrganizationId: organization.id,
          },
        });

        return organization;
      },
    })
    .mutation('update', {
      input: z.object({
        organizationId: z.string(),
        name: z.string().min(ORGANIZATION_NAME_MIN_LENGTH).max(ORGANIZATION_NAME_MAX_LENGTH),
        description: z.string().max(ORGANIZATION_DESCRIPTION_MAX_LENGTH).nullable(),
      }),
      resolve: async ({ input }) => {
        return prisma.organization.update({
          where: {
            id: input.organizationId,
          },
          data: {
            name: input.name,
            description: input.description,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            description: true,
          },
        });
      },
    })
    .mutation('delete', {
      input: z.object({
        organizationId: z.string(),
      }),
      resolve: async ({ ctx, input }) => {
        const functions = await prisma.function.findMany({
          where: {
            organizationId: input.organizationId,
          },
          select: {
            id: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            deployments: {
              select: {
                id: true,
              },
            },
          },
        });

        await prisma.function.deleteMany({
          where: {
            organizationId: input.organizationId,
          },
        });

        for (const func of functions) {
          for (const deployment of func.deployments) {
            await removeDeployment(
              {
                ...func,
                domains: func.domains.map(({ domain }) => domain),
              },
              deployment.id,
            );
          }

          await clickhouse.query(`alter table functions_result delete where functionId='${func.id}'`).toPromise();
          await clickhouse.query(`alter table logs delete where functionId='${func.id}'`).toPromise();
        }

        await prisma.organization.delete({
          where: {
            id: input.organizationId,
          },
        });

        const leftOrganization = await prisma.organization.findFirst({
          where: {
            ownerId: ctx.session.user.id,
          },
          select: {
            id: true,
          },
        });

        await prisma.user.update({
          where: {
            id: ctx.session.user.id,
          },
          data: {
            currentOrganizationId: leftOrganization?.id,
          },
        });

        return { ok: true };
      },
    })
    .mutation('current', {
      input: z.object({
        organizationId: z.string(),
      }),
      resolve: async ({ ctx, input }) => {
        await prisma.user.update({
          where: {
            id: ctx.session.user.id,
          },
          data: {
            currentOrganizationId: input.organizationId,
          },
        });

        return prisma.organization.findFirst({
          where: {
            id: input.organizationId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            description: true,
            ownerId: true,
          },
        });
      },
    });
