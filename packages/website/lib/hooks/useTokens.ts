import { trpc } from 'lib/trpc';

const useTokens = () => {
  return trpc.useQuery(['tokens.list'], {
    suspense: false,
  });
};

export default useTokens;
