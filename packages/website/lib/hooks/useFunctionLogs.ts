import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { GetLogsResponse } from 'pages/api/organizations/[organizationId]/functions/[functionId]/logs';
import { LogLevel, Timeframe } from 'lib/types';

const useFunctionLogs = ({
  functionId,
  logLevel,
  timeframe,
}: {
  functionId: string;
  logLevel: LogLevel;
  timeframe: Timeframe;
}) => {
  const {
    data: {
      organization: { id },
    },
  } = useSession();

  return useSWR<GetLogsResponse>(
    `/api/organizations/${id}/functions/${functionId}/logs?logLevel=${logLevel}&timeframe=${timeframe}`,
    {
      refreshInterval: 1000, // 1000ms = 1s
    },
  );
};

export default useFunctionLogs;
