export const ORGANIZATION_NAME_MIN_LENGTH = 3;
export const ORGANIZATION_NAME_MAX_LENGTH = 20;
export const ORGANIZATION_DESCRIPTION_MAX_LENGTH = 200;

export const FUNCTION_NAME_MIN_LENGTH = 5;
export const FUNCTION_NAME_MAX_LENGTH = 20;

export const FUNCTION_DEFAULT_MEMORY = 128; // 128MB
export const FUNCTION_DEFAULT_TIMEOUT = 50; // 50ms
export const FUNCTION_DEFAULT_STARTUP_TIMEOUT = 200; // 200ms
export const REGIONS = {
  'ashburn-us-east': 'Ashburn (us-east)',
  'hillsboro-us-west': 'Hillsboro (us-west)',
  'montreal-ca-east': 'Montreal (ca-east)',
  'london-eu-west': 'Londo (eu-west)',
  'paris-eu-west': 'Paris (eu-west)',
  'nuremberg-eu-central': 'Nuremberg (eu-central)',
  'helsinki-eu-north': 'Helsinki (eu-north)',
  'warsaw-eu-east': 'Warsaw (eu-east)',
  'singapore-ap-south': 'Singapore (ap-south)',
  'sydney-ap-south': 'Sydney (ap-south)',
};

export type Regions = keyof typeof REGIONS;
