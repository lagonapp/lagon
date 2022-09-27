import { LogLevel, Timeframe } from 'lib/types';
import { trpc } from 'lib/trpc';

const useFunctionLogs = ({
  functionId,
  logLevel,
  timeframe,
}: {
  functionId?: string;
  logLevel: LogLevel;
  timeframe: Timeframe;
}) => {
  return trpc.functionLogs.useQuery(
    { functionId: functionId || '', logLevel, timeframe },
    {
      refetchInterval: 1000,
      enabled: !!functionId,
    },
  );
};

export default useFunctionLogs;
