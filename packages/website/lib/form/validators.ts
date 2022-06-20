import { FieldValidator } from 'final-form';

export const requiredValidator: FieldValidator<string | number> = value => {
  return value ? undefined : 'Field is required';
};

export const cronValidator: FieldValidator<string | number> = value => {
  if (typeof value === 'string') {
    return /((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/.test(value) ? undefined : 'Field must be a Cron expression';
  }

  return 'Field must be a string';
};

export const composeValidators =
  (...validators: FieldValidator<string | number>[]): FieldValidator<string | number> =>
  value => {
    return validators.reduce((error, validator) => error || validator(value), undefined);
  };
