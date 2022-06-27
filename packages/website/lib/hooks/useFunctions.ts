import { trpc } from 'lib/trpc';

const useFunctions = () => {
  return trpc.useQuery(['functions.list']);
};

export default useFunctions;
