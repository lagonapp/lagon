import apiHandler from 'lib/api';
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import prisma from '@lagon/prisma';
import { createDeployment, removeCurrentDeployment } from 'lib/api/deployments';
import fs from 'node:fs';
import { getSession } from 'next-auth/react';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== 'POST') {
    response.status(405).end();
    return;
  }

  const tokenValue = request.headers['x-lagon-token'] as string;
  let email: string;

  if (!tokenValue) {
    const session = await getSession({ req: request });

    if (!session) {
      response.status(401).end();
      return;
    }

    email = session.user.email;
  } else {
    const token = await prisma.token.findFirst({
      where: {
        value: tokenValue,
      },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!token) {
      response.status(401).end();
      return;
    }

    email = token.user.email as string;
  }

  const form = new IncomingForm();

  let functionId: string;
  let code: string;
  const assets: { name: string; content: string }[] = [];

  form.on('field', (name, value) => {
    if (name === 'functionId') {
      functionId = value;
    }
  });

  form.on('file', (formName, file) => {
    console.log(formName, file);
    if (formName === 'code') {
      code = fs.readFileSync(file.filepath, 'utf-8');
    } else if (formName === 'assets') {
      assets.push({
        name: file.originalFilename!,
        content: fs.readFileSync(file.filepath, 'utf-8'),
      });
    }
  });

  form.on('end', async () => {
    const func = await prisma.function.findFirst({
      where: {
        id: functionId as string,
      },
      select: {
        id: true,
        name: true,
        domains: {
          select: {
            domain: true,
          },
        },
        memory: true,
        timeout: true,
        env: {
          select: {
            key: true,
            value: true,
          },
        },
      },
    });

    if (!func) {
      response.status(404).end();
      return;
    }

    try {
      await removeCurrentDeployment(func.id);
    } catch (_) {
      // this is the first deployment
    }

    const deployment = await createDeployment(
      {
        ...func,
        domains: func.domains.map(({ domain }) => domain),
      },
      code,
      assets,
      email,
    );

    return response.json({
      ...deployment,
      functionName: func.name,
    });
  });

  form.parse(request);
};

export default apiHandler(handler, { tokenAuth: false });
