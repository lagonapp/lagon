import { TRPCError } from '@trpc/server';
import { MAX_ORGANIZATIONS_PER_USER } from 'lib/constants';
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
