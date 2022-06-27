import { trpc } from 'lib/trpc';

const useOrganizations = () => {
  return trpc.useQuery(['organizations.list']);
};

export default useOrganizations;
