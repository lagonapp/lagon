import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { GetFunctionStatsResponse } from 'pages/api/organizations/[organizationId]/functions/[functionId]/stats';

const useFunctionStats = ({ functionId, timeframe }: { functionId: string; timeframe: string }) => {
  const {
    data: {
      organization: { id },
    },
  } = useSession();

  return useSWR<GetFunctionStatsResponse>(
    `/api/organizations/${id}/functions/${functionId}/stats?timeframe=${timeframe}`,
    { suspense: false },
  );
};

export default useFunctionStats;
