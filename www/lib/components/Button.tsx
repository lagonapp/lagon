import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { MouseEventHandler, ReactNode } from 'react';

const style = cva(
  'text-base leading-5 rounded-lg border border-transparent transition-all duration-300 flex items-center',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-primary-button text-dark',
        secondary: 'bg-gradient-secondary-button text-white',
        tertiary: 'bg-gradient-tertiary-button text-grey',
      },
      size: {
        md: 'px-3 py-2 gap-2',
        lg: 'px-4 py-3 gap-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type ButtonProps = {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  href?: string;
  children: ReactNode;
} & VariantProps<typeof style>;

export const Button = ({ leftIcon, rightIcon, onClick, className, href, children, ...props }: ButtonProps) => {
  if (href) {
    return (
      <Link onClick={onClick} className={style({ ...props, className })} href={href}>
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={style({ ...props, className })}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
