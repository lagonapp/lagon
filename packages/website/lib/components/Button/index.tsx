import Link from 'next/link';
import { MouseEventHandler, ReactElement, ReactNode } from 'react';
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

const Button = ({
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
}: ButtonProps) => {
  const styles = useTailwind(
    {
      variant,
      size,
      disabled,
      center,
    },
    {
      variant: {
        primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white border border-blue-700 shadow-blue-100',
        secondary:
          'bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-800 border border-stone-300 shadow-stone-100',
        danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border border-red-700 shadow-red-100',
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
        <a aria-disabled={disabled} className={`${styles} flex gap-2 items-center whitespace-nowrap shadow-sm`}>
          {leftIcon}
          {children}
          {rightIcon}
        </a>
      </Link>
    );
  }

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      type={submit ? 'submit' : 'button'}
      disabled={disabled}
      aria-disabled={disabled}
      className={`transition ${styles} flex gap-2 items-center whitespace-nowrap shadow-sm`}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};

export default Button;
