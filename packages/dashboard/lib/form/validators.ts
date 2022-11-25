import { FieldValidator } from 'final-form';

export const requiredValidator: FieldValidator<string | number> = value => {
  return value ? undefined : 'Field is required';
};

export const minLengthValidator =
  (minLength: number): FieldValidator<string | number> =>
  value => {
    return typeof value === 'string' && (!value || value.length >= minLength)
      ? undefined
      : 'Field must be at least ' + minLength + ' characters long';
  };

export const maxLengthValidator =
  (maxLength: number): FieldValidator<string | number> =>
  value => {
    return typeof value === 'string' && (!value || value.length <= maxLength)
      ? undefined
      : 'Field must be at most ' + maxLength + ' characters long';
  };

export const functionNameValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    return /^[a-zA-Z0-9-]*$/.test(value)
      ? undefined
      : 'Field must only contains alphanumerics characters, numbers and dashes';
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
    return /((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/.test(value) ? undefined : 'Field must be a Cron expression';
  }

  return typeof value === 'undefined' ? undefined : 'Field must be a string';
};

export const composeValidators =
  (...validators: FieldValidator<string | number>[]): FieldValidator<string | number> =>
  value => {
    return validators.reduce((error, validator) => error || validator(value), undefined);
  };
