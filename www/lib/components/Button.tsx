import { cva, VariantProps } from 'class-variance-authority';
import { MouseEventHandler, ReactNode } from 'react';

const style = cva(' text-base leading-5 px-3 py-2 rounded-lg border border-transparent transition-all duration-300', {
  variants: {
    variant: {
      primary: 'bg-gradient-primary-button text-dark',
      secondary: 'bg-gradient-secondary-button text-white',
      tertiary: 'bg-gradient-tertiary-button text-grey',
    },
  },
});

type ButtonProps = {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: MouseEventHandler;
  children: ReactNode;
} & VariantProps<typeof style>;

export const Button = ({ leftIcon, rightIcon, onClick, children, ...props }: ButtonProps) => {
  return (
    <button type="button" onClick={onClick} className={style(props)}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
