import useSWR from 'swr';
import { GetOrganizationsResponse } from 'pages/api/organizations';

const useOrganizations = () => {
  return useSWR<GetOrganizationsResponse>('/api/organizations');
};

export default useOrganizations;
