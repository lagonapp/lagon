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

  return {
    requests: trpc.statsRequests.useQuery(input, options),
    cpuTime: trpc.statsCpuTime.useQuery(input, options),
    // memoryUsage: trpc.statsMemoryUsage.useQuery(input, options),
    bytesIn: trpc.statsBytesIn.useQuery(input, options),
    bytesOut: trpc.statsBytesOut.useQuery(input, options),
  };
};

export default useFunctionStats;
