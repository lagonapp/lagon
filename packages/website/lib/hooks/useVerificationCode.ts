import { useSession } from 'next-auth/react';
import { GetVerificationCodeResponse } from 'pages/api/organizations/[organizationId]/cli';
import useSWR from 'swr';

const useVerificationCode = () => {
  const {
    data: {
      organization: { id },
    },
  } = useSession();

  return useSWR<GetVerificationCodeResponse>(`/api/organizations/${id}/cli`);
};

export default useVerificationCode;
