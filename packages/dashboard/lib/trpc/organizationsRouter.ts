import { removeFunction } from 'lib/api/deployments';
import {
  checkCanAddMember,
  checkCanCreateOrganization,
  checkIsOrganizationOwner,
  hasOrganizationMember,
} from 'lib/api/organizations';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { getPlanFromPriceId } from 'lib/plans';
import prisma from 'lib/prisma';
import { stripe } from 'lib/stripe';
import { T } from 'pages/api/trpc/[trpc]';
import { z } from 'zod';

export const organizationsRouter = (t: T) =>
  t.router({
    organizationsList: t.procedure.query(async ({ ctx }) => {
      return prisma.organization.findMany({
        where: {
          OR: [
            {
              ownerId: ctx.session.user.id,
            },
            {
              members: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
        },
      });
    }),
    organizationCreate: t.procedure
      .input(
        z.object({
          name: z.string().min(ORGANIZATION_NAME_MIN_LENGTH).max(ORGANIZATION_NAME_MAX_LENGTH),
          description: z.string().max(ORGANIZATION_DESCRIPTION_MAX_LENGTH).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await checkCanCreateOrganization({
          userId: ctx.session.user.id,
        });

        const organization = await prisma.organization.create({
          data: {
            name: input.name,
            description: input.description,
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
            currentOrganizationId: organization.id,
          },
        });

        return { ok: true };
      }),
    organizationUpdate: t.procedure
      .input(
        z.object({
          organizationId: z.string(),
          name: z.string().min(ORGANIZATION_NAME_MIN_LENGTH).max(ORGANIZATION_NAME_MAX_LENGTH),
          description: z.string().max(ORGANIZATION_DESCRIPTION_MAX_LENGTH).optional().nullable(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await checkIsOrganizationOwner({
          organizationId: input.organizationId,
          ownerId: ctx.session.user.id,
        });

        await prisma.organization.update({
          where: {
            id: input.organizationId,
          },
          data: {
            name: input.name,
            description: input.description,
          },
          select: null,
        });

        return { ok: true };
      }),
    organizationsDelete: t.procedure
      .input(
        z.object({
          organizationId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await checkIsOrganizationOwner({
          organizationId: input.organizationId,
          ownerId: ctx.session.user.id,
        });

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
            tickTimeout: true,
            totalTimeout: true,
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
                isProduction: true,
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
    organizationMembers: t.procedure.query(async ({ ctx }) => {
      return prisma.organization.findFirst({
        where: {
          id: ctx.session.organization.id,
        },
        select: {
          owner: {
            select: {
              id: true,
              email: true,
            },
          },
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
              createdAt: true,
            },
          },
        },
      });
    }),
    organizationAddMember: t.procedure
      .input(
        z.object({
          email: z.string().email(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const plan = getPlanFromPriceId({
          priceId: ctx.session.organization.stripePriceId,
          currentPeriodEnd: ctx.session.organization.stripeCurrentPeriodEnd,
        });

        await checkCanAddMember({
          organizationId: ctx.session.organization.id,
          plan,
        });

        await checkIsOrganizationOwner({
          organizationId: ctx.session.organization.id,
          ownerId: ctx.session.user.id,
        });

        const hasMember = await hasOrganizationMember({
          email: input.email,
          organizationId: ctx.session.organization.id,
        });

        if (hasMember) {
          throw new Error('User is already a member of this organization');
        }

        const user = await prisma.user.count({
          where: {
            email: input.email,
          },
        });

        if (user === 0) {
          throw new Error('User does not exist');
        }

        await prisma.organizationMember.create({
          data: {
            user: {
              connect: {
                email: input.email,
              },
            },
            organization: {
              connect: {
                id: ctx.session.organization.id,
              },
            },
          },
        });

        return { ok: true };
      }),
    organizationRemoveMember: t.procedure
      .input(
        z.object({
          userId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await checkIsOrganizationOwner({
          organizationId: ctx.session.organization.id,
          ownerId: ctx.session.user.id,
        });

        const hasMember = await hasOrganizationMember({
          id: input.userId,
          organizationId: ctx.session.organization.id,
        });

        if (!hasMember) {
          throw new Error('User is not a member of this organization');
        }

        const organizationMember = await prisma.organizationMember.findFirst({
          where: {
            organizationId: ctx.session.organization.id,
            userId: input.userId,
          },
          select: {
            id: true,
          },
        });

        if (!organizationMember) {
          throw new Error('Could not find organization member');
        }

        await prisma.organizationMember.delete({
          where: {
            id: organizationMember.id,
          },
        });

        await prisma.user.update({
          where: {
            id: input.userId,
          },
          data: {
            currentOrganizationId: null,
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

        return { ok: true };
      }),
    organizationCheckout: t.procedure
      .input(
        z.object({
          priceId: z.string(),
          priceIdMetered: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await checkIsOrganizationOwner({
          organizationId: ctx.session.organization.id,
          ownerId: ctx.session.user.id,
        });

        const session = await stripe.checkout.sessions.create({
          billing_address_collection: 'auto',
          line_items: [
            {
              price: input.priceId,
              quantity: 1,
            },
            {
              price: input.priceIdMetered,
            },
          ],
          mode: 'subscription',
          success_url: `${process.env.NEXTAUTH_URL}/settings?tab=billingUsage&updateSucceeded=true`,
          cancel_url: `${process.env.NEXTAUTH_URL}/settings?tab=billingUsage&updateFailed=true`,
          customer_email: ctx.session.user.email,
          metadata: {
            organizationId: ctx.session.organization.id,
          },
        });

        return {
          url: session.url,
        };
      }),
    organizationPlan: t.procedure
      .input(
        z.object({
          stripeCustomerId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await checkIsOrganizationOwner({
          organizationId: ctx.session.organization.id,
          ownerId: ctx.session.user.id,
        });

        const session = await stripe.billingPortal.sessions.create({
          customer: input.stripeCustomerId,
          return_url: `${process.env.NEXTAUTH_URL}/settings?tab=billingUsage`,
        });

        return {
          url: session.url,
        };
      }),
  });
