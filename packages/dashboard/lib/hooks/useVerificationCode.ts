import { trpc } from 'lib/trpc';

const useVerificationCode = () => {
  return trpc.tokensVerificationCode.useQuery();
};

export default useVerificationCode;
