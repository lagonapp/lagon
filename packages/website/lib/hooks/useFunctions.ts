import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { GetFunctionsResponse } from 'pages/api/organizations/[organizationId]/functions';

const useFunctions = () => {
  const {
    data: { organization },
  } = useSession();

  return useSWR<GetFunctionsResponse>(`/api/organizations/${organization?.id}/functions`);
};

export default useFunctions;
