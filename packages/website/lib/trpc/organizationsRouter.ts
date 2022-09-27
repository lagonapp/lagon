import { removeFunction } from 'lib/api/deployments';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import prisma from 'lib/prisma';
import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const organizationsRouter = (t: T) =>
  t.router({
    organizationsList: t.procedure.query(async ({ ctx }) => {
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
    }),
    organizationCreate: t.procedure
      .input(
        z.object({
          name: z.string(),
          description: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
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
      }),
    organizationUpdate: t.procedure
      .input(
        z.object({
          organizationId: z.string(),
          name: z.string().min(ORGANIZATION_NAME_MIN_LENGTH).max(ORGANIZATION_NAME_MAX_LENGTH),
          description: z.string().max(ORGANIZATION_DESCRIPTION_MAX_LENGTH).nullable(),
        }),
      )
      .mutation(async ({ input }) => {
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
      }),
    organizationsDelete: t.procedure
      .input(
        z.object({
          organizationId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const functions = await prisma.function.findMany({
          where: {
            organizationId: input.organizationId,
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            domains: {
              select: {
                domain: true,
              },
            },
            memory: true,
            timeout: true,
            cron: true,
            cronRegion: true,
            env: {
              select: {
                key: true,
                value: true,
              },
            },
            deployments: {
              select: {
                id: true,
                triggerer: true,
                commit: true,
                isCurrent: true,
                assets: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        const deleteFunctions = functions.map(removeFunction);

        await Promise.all(deleteFunctions);
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
      }),
    organizationSetCurrent: t.procedure
      .input(
        z.object({
          organizationId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
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
      }),
  });
