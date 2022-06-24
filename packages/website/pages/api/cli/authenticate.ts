import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';

const post = async (request: NextApiRequest, response: NextApiResponse) => {
  const { code } = JSON.parse(request.body) as { code: string };

  const user = await prisma.user.findFirst({
    where: {
      verificationCode: code,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    response.json({ error: 'Invalid verification code' });
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      verificationCode: null,
    },
  });

  let token = await prisma.token.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      value: true,
    },
  });

  if (!token) {
    token = await prisma.token.create({
      data: {
        value: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        userId: user.id,
      },
      select: {
        value: true,
      },
    });
  }

  response.json({ token: token.value });
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
