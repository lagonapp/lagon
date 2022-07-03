/* eslint-disable react/display-name */
import Link from 'next/link';
import { forwardRef, MouseEventHandler, MutableRefObject, ReactElement, ReactNode } from 'react';
import useTailwind from 'lib/hooks/useTailwind';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  leftIcon?: ReactElement;
  rightIcon?: ReactElement;
  center?: boolean;
  submit?: boolean;
  href?: string;
  onClick?: MouseEventHandler;
  children: ReactNode;
};

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      disabled,
      leftIcon,
      rightIcon,
      center,
      submit,
      href,
      onClick,
      children,
    }: ButtonProps,
    ref,
  ) => {
    const styles = useTailwind(
      {
        variant,
        size,
        disabled,
        center,
      },
      {
        variant: {
          primary:
            'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white border border-blue-700 shadow-blue-100 dark:shadow-blue-900',
          secondary:
            'bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-800 border border-stone-300 shadow-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 dark:active:bg-stone-700 dark:text-stone-200 dark:border-stone-600 dark:shadow-stone-900',
          danger:
            'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border border-red-700 shadow-red-100 dark:shadow-red-900',
        },
        size: {
          sm: 'px-2 py-1 rounded text-xs',
          md: 'px-3 py-1 rounded-md text-sm',
          lg: 'px-4 py-2 rounded-lg text-md',
        },
        disabled: 'cursor-not-allowed opacity-50',
        center: 'justify-center',
      },
    );

    if (href) {
      return (
        <Link href={href}>
          <a
            ref={ref as MutableRefObject<HTMLAnchorElement>}
            aria-disabled={disabled}
            className={`${styles} select-none flex gap-2 items-center whitespace-nowrap shadow-sm`}
          >
            {leftIcon}
            {children}
            {rightIcon}
          </a>
        </Link>
      );
    }

    return (
      <button
        ref={ref as MutableRefObject<HTMLButtonElement>}
        onClick={!disabled ? onClick : undefined}
        type={submit ? 'submit' : 'button'}
        disabled={disabled}
        aria-disabled={disabled}
        className={`${styles} transition select-none flex gap-2 items-center whitespace-nowrap shadow-sm`}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  },
);

export default Button;
