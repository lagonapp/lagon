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

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'GET':
      return get(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
