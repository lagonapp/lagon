import { trpc } from 'lib/trpc';
import { Timeframe } from 'lib/types';

const useFunctionStats = ({ functionId, timeframe }: { functionId?: string; timeframe: Timeframe }) => {
  const input = {
    functionId: functionId || '',
    timeframe,
  };

  const options = {
    enabled: !!functionId,
    suspense: false,
  };

  return trpc.usage.useQuery(input, options);
};

export default useFunctionStats;
