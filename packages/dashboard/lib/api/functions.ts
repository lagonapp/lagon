import prisma from 'lib/prisma';
import { randomName } from '@scaleway/use-random-name';
import { TRPCError } from '@trpc/server';
import type { Plan } from 'lib/plans';
import { FUNCTION_NAME_REGEX } from 'lib/constants';

const LAGON_BLACKLISTED_FUNCTIONS_NAMES = process.env.LAGON_BLACKLISTED_NAMES?.split(',') ?? [];

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

export function isFunctionNameAllowed(name: string): boolean {
  return FUNCTION_NAME_REGEX.test(name);
}

export function isFunctionNameBlacklisted(name: string): boolean {
  return LAGON_BLACKLISTED_FUNCTIONS_NAMES.includes(name.toLowerCase());
}

export async function checkCanCreateFunction({
  functionName,
  organizationId,
  plan,
}: {
  functionName?: string;
  organizationId: string;
  plan: Plan;
}) {
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
        id: organizationId,
      },
    },
  });

  if (functions >= plan.maxFunctions) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `You can only have ${plan.maxFunctions} Functions per Organization in your current plan`,
    });
  }
}

export async function checkCanQueryFunction({ functionId, userId }: { functionId: string; userId: string }) {
  const func = await prisma.function.count({
    where: {
      id: functionId,
      organization: {
        OR: [
          {
            members: {
              some: {
                userId,
              },
            },
          },
          { ownerId: userId },
        ],
      },
    },
  });

  if (func === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
    });
  }
}
