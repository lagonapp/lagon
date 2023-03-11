import { TRPCError } from '@trpc/server';
import { MAX_ORGANIZATIONS_PER_USER } from 'lib/constants';
import { Plan } from 'lib/plans';
import prisma from 'lib/prisma';

export async function checkCanCreateOrganization({ userId }: { userId: string }) {
  const organizations = await prisma.organization.count({
    where: {
      ownerId: userId,
    },
  });

  if (organizations >= MAX_ORGANIZATIONS_PER_USER) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `You can only have ${MAX_ORGANIZATIONS_PER_USER} Organizations per user`,
    });
  }
}

export async function checkIsOrganizationOwner({
  organizationId,
  ownerId,
}: {
  organizationId: string;
  ownerId: string;
}) {
  const organization = await prisma.organization.count({
    where: {
      id: organizationId,
      ownerId,
    },
  });

  if (organization === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
}

export async function hasOrganizationMember({
  id,
  email,
  organizationId,
}: {
  id?: string;
  email?: string;
  organizationId: string;
}) {
  if (id) {
    const member = await prisma.organizationMember.count({
      where: {
        userId: id,
        organizationId,
      },
    });

    return member > 0;
  } else if (email) {
    const member = await prisma.organizationMember.count({
      where: {
        user: {
          email,
        },
        organizationId,
      },
    });

    return member > 0;
  }

  return false;
}

export async function checkCanAddMember({ organizationId, plan }: { organizationId: string; plan: Plan }) {
  const organizationMembers = await prisma.organizationMember.count({
    where: {
      organization: {
        id: organizationId,
      },
    },
  });

  if (organizationMembers >= plan.organizationMembers) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `You can only have ${plan.organizationMembers} Members per Organization in your current plan`,
    });
  }
}
