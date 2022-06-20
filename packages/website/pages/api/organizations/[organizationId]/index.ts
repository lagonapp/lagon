import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';

export type PatchOrganizationResponse = {
  name: string;
  description: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

const patch = async (request: NextApiRequest, response: NextApiResponse<PatchOrganizationResponse>) => {
  const organizationId = request.query.organizationId as string;

  const { name, description } = JSON.parse(request.body) as {
    name: string;
    description: string;
  };

  const organization = await prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      name,
      description,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      description: true,
    },
  });

  response.json(organization);
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'PATCH':
      return patch(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
