import { XIcon } from '@heroicons/react/outline';
import useTailwind from 'lib/hooks/useTailwind';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Field, useForm, useFormState } from 'react-final-form';

type TagsInputProps = {
  name: string;
  placeholder?: string;
  disabled?: boolean;
};

const TagsInput = ({ name, placeholder, disabled }: TagsInputProps) => {
  const { values } = useFormState();
  const { change } = useForm();
  const [tags, setTags] = useState<string[]>(values[name] || []);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      {({ input }) => (
        <div
          onClick={onClick}
          className={`${styles} px-1.5 py-0.5 flex items-center rounded-md border border-stone-300 focus-within:outline-1 focus-within:outline-blue-500 focus-within:outline-offset-2`}
        >
          {tags.map(tag => (
            <span key={tag} className="text-xs px-1 py-0.5 rounded bg-stone-200 mr-1 inline-flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => {
                  setTags(tags.filter(currentTag => currentTag !== tag));
                }}
                className="text-stone-600 hover:text-stone-800"
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
              if (event.code === 'Space') {
                event.preventDefault();

                if (event.currentTarget.value.replace(/\s/, '') !== '') {
                  setTags([...tags, event.currentTarget.value]);

                  event.currentTarget.value = '';
                }
              }
            }}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            aria-disabled={disabled}
            className="text-sm text-stone-800 py-0.5 focus-visible:outline-none"
          />
        </div>
      )}
    </Field>
  );
};

export default TagsInput;
