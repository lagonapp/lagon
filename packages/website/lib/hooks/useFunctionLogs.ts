import { LogLevel, Timeframe } from 'lib/types';
import { trpc } from 'lib/trpc';

const useFunctionLogs = ({
  functionId,
  logLevel,
  timeframe,
}: {
  functionId: string;
  logLevel: LogLevel;
  timeframe: Timeframe;
}) => {
  return trpc.useQuery(['functions.logs', { functionId, logLevel, timeframe }], {
    refetchInterval: 1000,
  });
};

export default useFunctionLogs;
