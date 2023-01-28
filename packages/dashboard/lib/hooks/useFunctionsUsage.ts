import { trpc } from 'lib/trpc';

const useFunctionsUsage = ({ functions }: { functions: string[] }) => {
  return trpc.usage.useQuery({
    functions,
  });
};

export default useFunctionsUsage;
