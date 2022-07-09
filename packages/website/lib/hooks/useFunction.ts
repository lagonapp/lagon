import { trpc } from 'lib/trpc';

const useFunction = (functionId?: string) => {
  return trpc.useQuery(['functions.get', { functionId: functionId || '' }], {
    suspense: false,
    enabled: !!functionId,
  });
};

export default useFunction;
