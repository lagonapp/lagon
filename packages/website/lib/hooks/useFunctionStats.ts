import { trpc } from 'lib/trpc';

const useFunctionStats = ({ functionId, timeframe }: { functionId: string; timeframe: string }) => {
  return trpc.useQuery(['functions.stats', { functionId, timeframe }], {
    suspense: false,
  });
};

export default useFunctionStats;
