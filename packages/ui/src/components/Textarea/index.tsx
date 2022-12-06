import { Field } from 'react-final-form';
import { VariantProps } from 'class-variance-authority';
import { FieldValidator } from 'final-form';
import { Text } from '../';
import { variants } from './styles';

type TextareaProps = {
  name: string;
  placeholder?: string;
  disabled?: boolean;
  validator?: FieldValidator<string | number>;
} & VariantProps<typeof variants>;

export const Textarea = ({ name, placeholder, disabled, validator }: TextareaProps) => {
  const styles = variants({ disabled });

  return (
    <Field name={name} validate={validator}>
      {({ input, meta }) => (
        <>
          <textarea
            {...input}
            placeholder={placeholder}
            disabled={disabled}
            aria-disabled={disabled}
            className={styles}
          />
          {meta.touched && meta.error ? <Text error>{meta.error}</Text> : null}
        </>
      )}
    </Field>
  );
};
