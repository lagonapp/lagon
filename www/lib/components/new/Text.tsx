import { cva, VariantProps } from 'class-variance-authority';
import { ReactNode } from 'react';

const style = cva('', {
  variants: {
    size: {
      h1: 'text-5xl font-semibold',
      h2: 'text-4xl font-semibold',
      p: 'text-[#7F92AF] text-base',
      span: '',
    },
    variant: {
      default: 'text-white',
      radialGradientWhite: 'text-transparent bg-clip-text bg-radial-gradient-white',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type TextProps = {
  children: ReactNode;
} & VariantProps<typeof style>;

export const Text = ({ size: Tag = 'p', children, ...props }: TextProps) => {
  return <Tag className={style({ size: Tag, ...props })}>{children}</Tag>;
};
