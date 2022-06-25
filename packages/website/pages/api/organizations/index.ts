import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';

export type GetOrganizationsResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  ownerId: string;
}[];

export type CreateOrganizationResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  ownerId: string;
};

const get = async (request: NextApiRequest, response: NextApiResponse<GetOrganizationsResponse>) => {
  const {
    user: { id },
  } = request;

  const organizations = await prisma.organization.findMany({
    where: {
      ownerId: id,
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

  response.json(organizations);
};

const post = async (request: NextApiRequest, response: NextApiResponse<CreateOrganizationResponse>) => {
  const {
    user: { id },
  } = request;

  const { name, description } = JSON.parse(request.body) as {
    name: string;
    description: string;
  };

  const organization = await prisma.organization.create({
    data: {
      name,
      description,
      ownerId: id,
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
      id,
    },
    data: {
      currentOrganizationId: organization.id,
    },
  });

  response.json(organization);
};

const patch = async (request: NextApiRequest, response: NextApiResponse<CreateOrganizationResponse>) => {
  const {
    user: { id },
  } = request;

  const { organizationId } = JSON.parse(request.body) as {
    organizationId: string;
  };

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      currentOrganizationId: organizationId,
    },
  });

  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
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

  response.json(organization);
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'GET':
      return get(request, response);
    case 'POST':
      return post(request, response);
    case 'PATCH':
      return patch(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
