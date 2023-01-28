import { trpc } from 'lib/trpc';

const useTokens = () => {
  return trpc.tokensList.useQuery();
};

export default useTokens;
