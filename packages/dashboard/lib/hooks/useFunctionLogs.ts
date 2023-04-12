import { LogsLevel } from '@lagon/ui';
import { trpc } from 'lib/trpc';
import { LogsTimeframe } from 'lib/types';

const useFunctionLogs = ({
  functionId,
  level,
  timeframe,
}: {
  functionId?: string;
  level: LogsLevel;
  timeframe: LogsTimeframe;
}) => {
  return trpc.functionLogs.useQuery(
    { functionId: functionId || '', level, timeframe },
    {
      refetchInterval: 5000,
      enabled: !!functionId,
    },
  );
};

export default useFunctionLogs;
