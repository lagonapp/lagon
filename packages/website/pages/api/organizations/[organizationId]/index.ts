import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';
import { removeDeployment } from 'lib/api/deployments';
import { ClickHouse } from 'clickhouse';

const clickhouse = new ClickHouse({});

export type UpdateOrganizationResponse = {
  name: string;
  description: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

const patch = async (request: NextApiRequest, response: NextApiResponse<UpdateOrganizationResponse>) => {
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

const del = async (request: NextApiRequest, response: NextApiResponse) => {
  const organizationId = request.query.organizationId as string;

  const functions = await prisma.function.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      name: true,
      domains: true,
      memory: true,
      timeout: true,
      env: true,
      deployments: {
        select: {
          id: true,
        },
      },
    },
  });

  await prisma.function.deleteMany({
    where: {
      organizationId,
    },
  });

  for (const func of functions) {
    for (const deployment of func.deployments) {
      await removeDeployment(func, deployment.id);
    }

    await clickhouse.query(`alter table functions_result delete where functionId='${func.id}'`).toPromise();
    await clickhouse.query(`alter table logs delete where functionId='${func.id}'`).toPromise();
  }

  await prisma.organization.delete({
    where: {
      id: organizationId,
    },
  });

  const leftOrganization = await prisma.organization.findFirst({
    where: {
      ownerId: request.user.id,
    },
    select: {
      id: true,
    },
  });

  await prisma.user.update({
    where: {
      id: request.user.id,
    },
    data: {
      currentOrganizationId: leftOrganization?.id,
    },
  });

  response.json({ ok: true });
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'PATCH':
      return patch(request, response);
    case 'DELETE':
      return del(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler);
