import { trpc } from 'lib/trpc';

const useFunctions = () => {
  return trpc.functionsList.useQuery();
};

export default useFunctions;
