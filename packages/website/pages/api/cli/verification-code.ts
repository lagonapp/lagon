import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';

export type GetVerificationCodeResponse = {
  code: string;
};

const get = async (request: NextApiRequest, response: NextApiResponse<GetVerificationCodeResponse>) => {
  const userId = request.query.userId as string;

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      verificationCode: true,
    },
  });

  let verificationCode: string | null = user.verificationCode;

  if (!verificationCode) {
    verificationCode = (
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          verificationCode: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
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
