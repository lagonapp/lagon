import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { HTMLAttributeAnchorTarget, ReactNode } from 'react';

const style = cva('', {
  variants: {
    size: {
      h1: 'text-5xl font-semibold',
      h2: 'text-[40px] leading-10 font-semibold',
      h3: 'text-2xl font-semibold',
      p: 'text-[#7F92AF] text-base',
      a: 'text-[#7F92AF] text-base hover:text-white transition',
      span: '',
    },
    variant: {
      default: 'text-white',
      bold: '!text-white font-semibold',
      radialGradientWhite: 'text-transparent bg-clip-text bg-radial-gradient-white',
    },
    paragraph: {
      true: 'leading-relaxed',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type TextProps = {
  children: ReactNode;
  href?: string;
  target?: HTMLAttributeAnchorTarget;
  className?: string;
} & VariantProps<typeof style>;

export const Text = ({ size: Tag = 'p', href, target, children, className, ...props }: TextProps) => {
  if (Tag === 'a') {
    return (
      <Link href={href || ''} target={target} className={`${style({ size: Tag, ...props })} ${className}`}>
        {children}
      </Link>
    );
  }

  return <Tag className={`${style({ size: Tag, ...props })} ${className}`}>{children}</Tag>;
};
