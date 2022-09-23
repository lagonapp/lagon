export const ORGANIZATION_NAME_MIN_LENGTH = 3;
export const ORGANIZATION_NAME_MAX_LENGTH = 20;
export const ORGANIZATION_DESCRIPTION_MAX_LENGTH = 200;

export const FUNCTION_NAME_MIN_LENGTH = 5;
export const FUNCTION_NAME_MAX_LENGTH = 20;

export const FUNCTION_DEFAULT_MEMORY = 128; // 128MB
export const FUNCTION_DEFAULT_TIMEOUT = 50; // 50ms
export const REGIONS = {
  'EU-WEST-3': 'eu-west-3 (Paris)',
};

export type Regions = keyof typeof REGIONS;
