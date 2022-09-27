import { trpc } from 'lib/trpc';
import { Timeframe } from 'lib/types';

const useFunctionStats = ({ functionId, timeframe }: { functionId?: string; timeframe: Timeframe }) => {
  return trpc.functionStats.useQuery(
    { functionId: functionId || '', timeframe },
    {
      enabled: !!functionId,
      suspense: false,
    },
  );
};

export default useFunctionStats;
