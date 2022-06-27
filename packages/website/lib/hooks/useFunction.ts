import { useSession } from 'next-auth/react';
import { trpc } from 'lib/trpc';

const useFunction = (functionId: string) => {
  const {
    data: {
      organization: { id },
    },
  } = useSession();

  return trpc.useQuery(['functions.get', { organizationId: id, functionId }]);
};

export default useFunction;
