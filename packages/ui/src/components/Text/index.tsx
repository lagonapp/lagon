import { forwardRef, ReactNode, useMemo } from 'react';
import { variants } from './styles';

type TextProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  strong?: boolean;
  error?: boolean;
  className?: string;
  children: ReactNode;
};

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
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

    const styles = variants({ size, strong, error, className });

    return (
      <Tag ref={ref} className={styles}>
        {children}
      </Tag>
    );
  },
);
