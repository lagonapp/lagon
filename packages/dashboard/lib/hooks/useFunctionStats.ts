import { trpc } from 'lib/trpc';
import { AnalyticsTimeframe } from 'lib/types';

const useFunctionStats = ({ functionId, timeframe }: { functionId?: string; timeframe: AnalyticsTimeframe }) => {
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
