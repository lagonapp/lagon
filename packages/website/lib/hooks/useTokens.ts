import { trpc } from 'lib/trpc';

const useTokens = () => {
  return trpc.tokensList.useQuery(undefined, {
    suspense: false,
  });
};

export default useTokens;
