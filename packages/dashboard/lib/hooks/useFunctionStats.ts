import { trpc } from 'lib/trpc';
import { Timeframe } from 'lib/types';

const useFunctionStats = ({ functionId, timeframe }: { functionId?: string; timeframe: Timeframe }) => {
  return trpc.stats.useQuery(
    {
      functionId: functionId || '',
      timeframe,
    },
    {
      enabled: !!functionId,
    },
  );
};

export default useFunctionStats;
