import { trpc } from 'lib/trpc';

const useFunctionCode = (functionId: string) => {
  return trpc.functionCode.useQuery(
    { functionId },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );
};

export default useFunctionCode;
