import { useSession } from 'next-auth/react';
import { GetVerificationCodeResponse } from 'pages/api/cli/verification-code';
import useSWR from 'swr';

const useVerificationCode = () => {
  const {
    data: { user },
  } = useSession();

  return useSWR<GetVerificationCodeResponse>(`/api/cli/verification-code?userId=${user.id}`, {
    refreshInterval: 1000,
  });
};

export default useVerificationCode;
