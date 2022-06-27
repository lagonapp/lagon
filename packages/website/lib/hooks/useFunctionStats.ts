import { trpc } from 'lib/trpc';
import { Timeframe } from 'lib/types';

const useFunctionStats = ({ functionId, timeframe }: { functionId: string; timeframe: Timeframe }) => {
  return trpc.useQuery(['functions.stats', { functionId, timeframe }], {
    suspense: false,
  });
};

export default useFunctionStats;
