import { trpc } from 'lib/trpc';

const useFunction = (functionId?: string) => {
  return trpc.functionGet.useQuery(
    {
      functionId: functionId || '',
    },
    {
      suspense: false,
      enabled: !!functionId,
    },
  );
};

export default useFunction;
