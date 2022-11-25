import { trpc } from 'lib/trpc';

const useOrganizations = () => {
  return trpc.organizationsList.useQuery();
};

export default useOrganizations;
