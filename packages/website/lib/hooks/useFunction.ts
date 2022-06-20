import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { GetFunctionResponse } from 'pages/api/organizations/[organizationId]/functions/[functionId]';

const useFunction = (functionId: string) => {
  const {
    data: {
      organization: { id },
    },
  } = useSession();

  return useSWR<GetFunctionResponse>(`/api/organizations/${id}/functions/${functionId}`);
};

export default useFunction;
