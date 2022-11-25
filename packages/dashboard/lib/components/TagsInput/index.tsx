import { XIcon } from '@heroicons/react/outline';
import { FieldValidator } from 'final-form';
import useTailwind from 'lib/hooks/useTailwind';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Field, useForm, useFormState } from 'react-final-form';
import Text from '../Text';

type TagsInputProps = {
  name: string;
  placeholder?: string;
  disabled?: boolean;
  validator?: FieldValidator<string | number>;
};

const TagsInput = ({ name, placeholder, disabled, validator }: TagsInputProps) => {
  const { values } = useFormState();
  const { change } = useForm();
  const [tags, setTags] = useState<string[]>(values[name] || []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState(undefined);

  const onClick = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const styles = useTailwind(
    {
      disabled,
    },
    {
      disabled: 'cursor-not-allowed opacity-50',
    },
  );

  useEffect(() => {
    change(name, tags);
  }, [tags, name, change]);

  return (
    <Field name={name}>
      {({ input, meta }) => (
        <div className="flex flex-col gap-2">
          <div
            onClick={onClick}
            className={`${styles} bg-white dark:bg-stone-900 px-1.5 py-0.5 flex items-center rounded-md border border-stone-300 dark:border-stone-600 focus-within:outline-1 focus-within:outline-blue-500 focus-within:outline-offset-2`}
          >
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-1 py-0.5 rounded text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-700 mr-1 inline-flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setTags(tags.filter(currentTag => currentTag !== tag));
                  }}
                  className="text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              name={input.name}
              onBlur={input.onBlur}
              onFocus={input.onFocus}
              onKeyDown={event => {
                if (error) {
                  setError(undefined);
                }

                const { value } = event.currentTarget;
                const isEmpty = value.replace(/\s/, '') === '';

                if (event.code === 'Space' || event.code === 'Enter') {
                  event.preventDefault();

                  if (!isEmpty) {
                    const error = validator?.(value);

                    if (error) {
                      setError(error);
                      return;
                    }

                    setTags([...tags, value]);

                    event.currentTarget.value = '';
                  }
                } else if (event.code === 'Backspace' && isEmpty) {
                  event.preventDefault();

                  setTags([...tags.slice(0, -1)]);
                }
              }}
              type="text"
              placeholder={placeholder}
              disabled={disabled}
              aria-disabled={disabled}
              className="bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-200 py-0.5 focus-visible:outline-none"
            />
          </div>
          {meta.touched && error ? <Text error>{error}</Text> : null}
        </div>
      )}
    </Field>
  );
};

export default TagsInput;
