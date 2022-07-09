import { trpc } from 'lib/trpc';

const useFunction = (functionId: string) => {
  return trpc.useQuery(['functions.get', { functionId }], {
    suspense: false,
  });
};

export default useFunction;
