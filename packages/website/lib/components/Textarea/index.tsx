import { Field } from 'react-final-form';
import useTailwind from 'lib/hooks/useTailwind';

type TextareaProps = {
  name: string;
  placeholder?: string;
  disabled?: boolean;
};

const Textarea = ({ name, placeholder, disabled }: TextareaProps) => {
  const styles = useTailwind(
    {
      disabled,
    },
    {
      disabled: 'cursor-not-allowed opacity-50',
    },
  );

  return (
    <Field name={name}>
      {({ input }) => (
        <textarea
          {...input}
          placeholder={placeholder}
          disabled={disabled}
          aria-disabled={disabled}
          className={`${styles} px-3 py-1 rounded-md text-base text-gray-800 border border-gray-300`}
        />
      )}
    </Field>
  );
};

export default Textarea;
