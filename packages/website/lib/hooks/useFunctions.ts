import { useSession } from 'next-auth/react';
import { trpc } from 'lib/trpc';

const useFunctions = () => {
  const {
    data: { organization },
  } = useSession();

  return trpc.useQuery(['functions.list', { organizationId: organization.id }]);
};

export default useFunctions;
