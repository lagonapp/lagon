import { trpc } from 'lib/trpc';

const useVerificationCode = () => {
  return trpc.useQuery(['tokens.verification-code']);
};

export default useVerificationCode;
