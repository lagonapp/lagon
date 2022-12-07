import { Field } from 'react-final-form';
import { VariantProps } from 'class-variance-authority';
import { FieldValidator } from 'final-form';
import { Text } from '../';
import { variants } from './styles';

type InputProps = {
  name: string;
  type?: string;
  placeholder?: string;
  validator?: FieldValidator<string | number>;
} & VariantProps<typeof variants>;

export const Input = ({ name, type = 'text', placeholder, disabled, validator }: InputProps) => {
  const styles = variants({ disabled });

  return (
    <Field name={name} validate={validator}>
      {({ input, meta }) => (
        <div className="flex flex-col gap-2">
          <input
            {...input}
            type={type}
            placeholder={placeholder}
            disabled={!!disabled}
            aria-disabled={!!disabled}
            className={styles}
          />
          {meta.touched && meta.error ? <Text error>{meta.error}</Text> : null}
        </div>
      )}
    </Field>
  );
};
