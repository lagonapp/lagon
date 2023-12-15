import { FieldValidator } from 'final-form';
import { FUNCTION_NAME_REGEX } from 'lib/constants';
import cronstrue from 'cronstrue';

export const requiredValidator: FieldValidator<string | number> = value => {
  return value ? undefined : 'Field is required';
};

export const minLengthValidator =
  (minLength: number): FieldValidator<string | number> =>
  value => {
    return value === undefined || (typeof value === 'string' && value.length >= minLength)
      ? undefined
      : 'Field must be at least ' + minLength + ' characters long';
  };

export const maxLengthValidator =
  (maxLength: number): FieldValidator<string | number> =>
  value => {
    return value === undefined || (typeof value === 'string' && value.length <= maxLength)
      ? undefined
      : 'Field must be at most ' + maxLength + ' characters long';
  };

export const functionNameValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    return FUNCTION_NAME_REGEX.test(value)
      ? undefined
      : 'Function name must only contain lowercase alphanumeric characters and dashes';
  }

  return 'Field must be a string';
};

export const domainNameValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    return /^[a-z0-9-]+(\.[a-z0-9-]{1,63})+$/.test(value) ? undefined : 'Field must be a domain or subdomain';
  }

  return 'Field must be a string';
};

export const cronValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    try {
      cronstrue.toString(value);
    } catch (e) {
      return 'Field must be a Cron expression';
    }
  }

  return undefined;
};

export const emailValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Field must be an email address';
  }

  return 'Field must be a string';
};

export const alphaNumUnderscoreValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    return /^[a-zA-Z0-9_]+$/.test(value)
      ? undefined
      : 'Field must only contain alphanumeric characters and underscores';
  }

  return undefined;
};

export const composeValidators =
  (...validators: FieldValidator<string | number>[]): FieldValidator<string | number> =>
  value => {
    return validators.reduce((error, validator) => error || validator(value), undefined);
  };
