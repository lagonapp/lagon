import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';
import { getDeploymentCode } from 'lib/api/deployments';

export type GetFunctionCodeResponse = {
  code: string;
};

const get = async (request: NextApiRequest, response: NextApiResponse<GetFunctionCodeResponse>) => {
  const functionId = request.query.functionId as string;

  const deployment = await prisma.deployment.findFirst({
    where: {
      functionId,
      isCurrent: true,
    },
    select: {
      id: true,
    },
  });

  const code = await getDeploymentCode(deployment.id);

  response.json({ code });
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
