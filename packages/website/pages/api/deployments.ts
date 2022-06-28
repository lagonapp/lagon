import { NextApiRequest, NextApiResponse } from 'next';
import apiHandler from 'lib/api';
import prisma from 'lib/prisma';
import { envStringToObject } from 'lib/api/env';

// Should match Deployment in @lagon/runtime
export type GetDeploymentsResponse = {
  functionId: string;
  functionName: string;
  deploymentId: string;
  domains: string[];
  memory: number;
  timeout: number;
  env: Record<string, string>;
  isCurrent: boolean;
}[];

const handler = async (request: NextApiRequest, response: NextApiResponse<GetDeploymentsResponse>) => {
  const deployments = await prisma.deployment.findMany({
    select: {
      id: true,
      isCurrent: true,
      function: {
        select: {
          id: true,
          name: true,
          domains: true,
          memory: true,
          timeout: true,
          env: true,
        },
      },
    },
  });

  response.json(
    deployments.map(
      ({
        id: deploymentId,
        isCurrent,
        function: { id: functionId, name: functionName, domains, memory, timeout, env },
      }) => ({
        functionId,
        functionName,
        deploymentId,
        domains,
        memory,
        timeout,
        env: envStringToObject(env),
        isCurrent,
      }),
    ),
  );
};

export default apiHandler(handler);
