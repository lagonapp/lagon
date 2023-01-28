import { trpc } from 'lib/trpc';

const useFunction = (functionId?: string, suspense = true) => {
  return trpc.functionGet.useQuery(
    {
      functionId: functionId || '',
    },
    {
      suspense,
      enabled: !!functionId,
    },
  );
};

export default useFunction;
