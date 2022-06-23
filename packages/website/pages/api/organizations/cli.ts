import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';

const post = async (request: NextApiRequest, response: NextApiResponse) => {
  const { code } = JSON.parse(request.body) as { code: string };

  const organization = await prisma.organization.findFirst({
    where: {
      verificationCode: code,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    response.json({ error: 'Invalid verification code' });
    return;
  }

  // TODO: return generated token
  response.json({ token: organization.id });
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  switch (request.method) {
    case 'POST':
      return post(request, response);
    default:
      response.status(405).end();
  }
};

export default apiHandler(handler, { auth: false });
