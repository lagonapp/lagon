/* eslint-disable react/display-name */
import { forwardRef, ReactNode, useMemo } from 'react';
import useTailwind from 'lib/hooks/useTailwind';

type TextProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  strong?: boolean;
  error?: boolean;
  className?: string;
  children: ReactNode;
};

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ size = 'md', strong, error, className, children }: TextProps, ref) => {
    const Tag = useMemo(() => {
      switch (size) {
        case 'sm':
          return 'span';
        case 'md':
        case 'lg':
          return 'p';
        case 'xl':
          return 'h3';
        case '2xl':
          return 'h2';
      }
    }, [size]);

    const styles = useTailwind(
      {
        size,
        strong,
        error,
      },
      {
        size: {
          sm: 'text-xs text-stone-500 dark:text-stone-500',
          md: 'text-sm text-stone-800 dark:text-stone-400',
          lg: 'text-lg text-stone-900 dark:text-stone-50',
          xl: 'text-xl text-stone-900 dark:text-stone-50 font-semibold',
          '2xl': 'text-2xl text-stone-900 dark:text-stone-50 font-semibold',
        },
        strong: 'font-semibold',
        error: 'text-red-500 dark:text-red-500',
      },
    );

    return (
      <Tag ref={ref} className={`${styles} ${className}`}>
        {children}
      </Tag>
    );
  },
);

export default Text;
