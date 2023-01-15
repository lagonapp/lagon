import prisma from 'lib/prisma';
import { randomName } from '@scaleway/use-random-name';
import { TRPCError } from '@trpc/server';
import { MAX_FUNCTIONS_PER_ORGANIZATION } from 'lib/constants';

export async function isFunctionNameUnique(name: string): Promise<boolean> {
  const result = await prisma.function.findFirst({
    where: {
      name,
    },
  });

  return result === null;
}

export async function findUniqueFunctionName(): Promise<string> {
  const name = randomName();
  const isUnique = isFunctionNameUnique(name);

  if (!isUnique) {
    return findUniqueFunctionName();
  }

  return name;
}

export async function checkCanCreateFunction({ functionName, ownerId }: { functionName?: string; ownerId: string }) {
  if (functionName) {
    if (!isFunctionNameUnique(functionName)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A Function with the same name already exists',
      });
    }
  }

  const functions = await prisma.function.count({
    where: {
      organization: {
        ownerId,
      },
    },
  });

  if (functions >= MAX_FUNCTIONS_PER_ORGANIZATION) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `You can only have ${MAX_FUNCTIONS_PER_ORGANIZATION} Functions per Organization`,
    });
  }
}

export async function checkCanQueryFunction({ functionId, ownerId }: { functionId: string; ownerId: string }) {
  const func = await prisma.function.count({
    where: {
      id: functionId,
      organization: {
        ownerId,
      },
    },
  });

  if (func === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
}
