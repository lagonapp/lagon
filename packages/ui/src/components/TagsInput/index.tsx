import { XMarkIcon } from '@heroicons/react/24/outline';
import { FieldValidator } from 'final-form';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Field, useForm, useFormState } from 'react-final-form';
import { VariantProps } from 'class-variance-authority';
import { Text } from '../';
import { variants } from './styles';

type TagsInputProps = {
  name: string;
  placeholder?: string;
  validator?: FieldValidator<string | number>;
} & VariantProps<typeof variants>;

export const TagsInput = ({ name, placeholder, disabled, validator }: TagsInputProps) => {
  const { values } = useFormState();
  const { change } = useForm();
  const [tags, setTags] = useState<string[]>(values[name] || []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState(undefined);

  const onClick = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const styles = variants({ disabled });

  useEffect(() => {
    change(name, tags);
  }, [tags, name, change]);

  return (
    <Field name={name}>
      {({ input, meta }) => (
        <div className="flex flex-col gap-2">
          <div onClick={onClick} className={styles}>
            {tags.map(tag => (
              <span
                key={tag}
                className="mr-1 inline-flex items-center gap-1 rounded bg-stone-200 px-1 py-0.5 text-xs text-stone-800 dark:bg-stone-700 dark:text-stone-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setTags(tags.filter(currentTag => currentTag !== tag));
                  }}
                  className="text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  <XMarkIcon className="h-3 w-3" />
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
              disabled={!!disabled}
              aria-disabled={!!disabled}
              className="bg-white py-0.5 text-sm text-stone-800 focus-visible:outline-none dark:bg-stone-900 dark:text-stone-200"
            />
          </div>
          {meta.touched && error ? <Text error>{error}</Text> : null}
        </div>
      )}
    </Field>
  );
};
