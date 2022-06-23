import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';

export type GetVerificationCodeResponse = {
  code: string;
};

const get = async (request: NextApiRequest, response: NextApiResponse<GetVerificationCodeResponse>) => {
  const organizationId = request.query.organizationId as string;

  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
    },
    select: {
      verificationCode: true,
    },
  });

  let verificationCode: string | null = organization.verificationCode;

  if (!organization.verificationCode) {
    verificationCode = (
      await prisma.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          verificationCode: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        },
        select: {
          verificationCode: true,
        },
      })
    ).verificationCode;
  }

  response.json({ code: verificationCode });
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
