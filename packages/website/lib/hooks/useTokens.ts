import { trpc } from 'lib/trpc';

const useTokens = () => {
  return trpc.useQuery(['tokens.list']);
};

export default useTokens;
