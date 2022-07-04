import { Field } from 'react-final-form';
import useTailwind from 'lib/hooks/useTailwind';
import { FieldValidator } from 'final-form';
import Text from '../Text';

type TextareaProps = {
  name: string;
  placeholder?: string;
  disabled?: boolean;
  validator?: FieldValidator<string | number>;
};

const Textarea = ({ name, placeholder, disabled, validator }: TextareaProps) => {
  const styles = useTailwind(
    {
      disabled,
    },
    {
      disabled: 'cursor-not-allowed opacity-50',
    },
  );

  return (
    <Field name={name} validate={validator}>
      {({ input, meta }) => (
        <>
          <textarea
            {...input}
            placeholder={placeholder}
            disabled={disabled}
            aria-disabled={disabled}
            className={`${styles} bg-white dark:bg-stone-900 px-3 py-1 rounded-md text-sm text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600`}
          />
          {meta.touched && meta.error ? <Text error>{meta.error}</Text> : null}
        </>
      )}
    </Field>
  );
};

export default Textarea;
