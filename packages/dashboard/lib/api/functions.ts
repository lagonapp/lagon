import prisma from 'lib/prisma';
import { randomName } from '@scaleway/use-random-name';

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
