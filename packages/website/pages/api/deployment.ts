import apiHandler from 'lib/api';
import { NextApiRequest, NextApiResponse } from 'next';
import { File, IncomingForm } from 'formidable';
import prisma from 'lib/prisma';
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

  form.parse(request, async (err, fields, files) => {
    const { functionId } = fields;
    const { code, assets } = files;

    const func = await prisma.function.findFirst({
      where: {
        id: functionId as string,
      },
      select: {
        id: true,
        name: true,
        domains: true,
        memory: true,
        timeout: true,
        env: true,
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
      func,
      fs.readFileSync((code as File).filepath, 'utf-8'),
      assets
        ? Array.isArray(assets)
          ? assets.map(asset => ({ name: asset.originalFilename!, content: fs.readFileSync(asset.filepath, 'utf-8') }))
          : [{ name: assets.originalFilename!, content: fs.readFileSync(assets.filepath, 'utf-8') }]
        : [],
      email,
    );

    return response.json(deployment);
  });
};

export default apiHandler(handler, { tokenAuth: false });
