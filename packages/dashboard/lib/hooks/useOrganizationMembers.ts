import { trpc } from 'lib/trpc';

const useOrganizationMembers = () => {
  return trpc.organizationMembers.useQuery();
};

export default useOrganizationMembers;
