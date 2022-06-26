import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { GetFunctionCodeResponse } from 'pages/api/organizations/[organizationId]/functions/[functionId]/code';

const useFunctionCode = (functionId: string) => {
  const {
    data: {
      organization: { id },
    },
  } = useSession();

  return useSWR<GetFunctionCodeResponse>(`/api/organizations/${id}/functions/${functionId}/code`, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
};

export default useFunctionCode;
