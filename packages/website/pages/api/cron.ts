import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@lagon/prisma';
import { parseExpression } from 'cron-parser';
import apiHandler from 'lib/api';

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.headers['x-lagon-token'] !== process.env.LAGON_TOKEN) {
    return response.status(401).end();
  }

  const functions = await prisma.function.findMany({
    where: {
      cron: {
        not: null,
      },
    },
    select: {
      id: true,
      domains: true,
      memory: true,
      timeout: true,
      cron: true,
      deployments: {
        select: {
          id: true,
          isCurrent: true,
        },
      },
    },
  });

  const now = new Date();

  const promises = functions.map(async func => {
    try {
      const interval = parseExpression(func.cron || '');
      const next = interval.prev();

      // console.log(
      //   next.getMinutes(),
      //   now.getMinutes(),
      //   next.getHours(),
      //   now.getHours(),
      //   next.getDate(),
      //   now.getDate(),
      //   next.getMonth(),
      //   now.getMonth(),
      //   next.getDay(),
      //   now.getDay(),
      // );

      // console.log(
      //   next.getMinutes() === now.getMinutes() &&
      //     next.getHours() === now.getHours() &&
      //     next.getDate() === now.getDate() &&
      //     next.getMonth() === now.getMonth() &&
      //     next.getDay() === now.getDay(),
      // );

      if (
        !(
          next.getMinutes() === now.getMinutes() &&
          next.getHours() === now.getHours() &&
          next.getDate() === now.getDate() &&
          next.getMonth() === now.getMonth() &&
          next.getDay() === now.getDay()
        )
      ) {
        return;
      }

      const deployment = func.deployments.find(deployment => deployment.isCurrent);

      if (!deployment) {
        return;
      }

      console.log('Run cron');

      return fetch(`http://${func.domains[0]}`);
    } catch (e) {
      console.error(e);
    }
  });

  // await Promise.all(promises);

  response.json({});
};

export default apiHandler(handler);
