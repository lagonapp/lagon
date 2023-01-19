import { cva, VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { HTMLAttributeAnchorTarget, ReactNode } from 'react';
import { Poppins } from '@next/font/google';

const poppins = Poppins({
  style: ['normal'],
  weight: '500',
  subsets: ['latin'],
});

const style = cva('', {
  variants: {
    size: {
      h1: 'text-5xl font-semibold',
      h2: 'text-5xl leading-10 font-semibold',
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
  scroll?: boolean;
} & VariantProps<typeof style>;

export const Text = ({ size: Tag = 'p', href, target, children, className, scroll, ...props }: TextProps) => {
  if (Tag === 'a') {
    return (
      <Link href={href || ''} target={target} className={style({ size: Tag, className, ...props })} scroll={scroll}>
        {children}
      </Link>
    );
  }

  if (['h1', 'h2', 'h3'].includes(Tag ?? 'p')) {
    if (className) {
      className += ` ${poppins.className}`;
    } else {
      className = poppins.className;
    }
  }

  // @ts-expect-error to fix
  return <Tag className={style({ size: Tag, className, ...props })}>{children}</Tag>;
};
