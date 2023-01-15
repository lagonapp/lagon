import prisma from 'lib/prisma';

export async function createOrAssignDefaultOrganization(user: {
  name?: string | null;
  email?: string | null;
  id: string;
}) {
  // Email address is always returned for GitHub provider
  // https://next-auth.js.org/providers/github#example
  const name = user.name || (user.email as string);

  const dbUser = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
  });

  let organizationId = dbUser?.currentOrganizationId;

  if (!organizationId) {
    const { id } = await prisma.organization.create({
      data: {
        name,
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

    organizationId = id;
  }

  return organizationId;
}
