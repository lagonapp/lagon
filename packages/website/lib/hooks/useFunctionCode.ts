import { trpc } from 'lib/trpc';

const useFunctionCode = (functionId: string) => {
  return trpc.useQuery(['functions.code', { functionId }], {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export default useFunctionCode;
