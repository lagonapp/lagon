import { ReactNode, useMemo } from 'react';
import { Text } from '../Text';

type BannerProps = {
  variant?: 'info' | 'success' | 'warn' | 'error';
  children: ReactNode;
};

export const Banner = ({ variant = 'info', children }: BannerProps) => {
  const { containerStyle, messageStyle } = useMemo(() => {
    switch (variant) {
      case 'success':
        return {
          containerStyle: 'bg-green-100 dark:bg-green-900',
          messageStyle: 'text-green-900 dark:text-green-100',
        };
      case 'warn':
        return {
          containerStyle: 'bg-amber-100 dark:bg-amber-900',
          messageStyle: 'text-amber-900 dark:text-amber-100',
        };
      case 'error':
        return {
          containerStyle: 'bg-red-100 dark:bg-red-900',
          messageStyle: 'text-red-900 dark:text-red-100',
        };
      default:
        return {
          containerStyle: 'bg-blue-100 dark:bg-blue-900',
          messageStyle: 'text-blue-900 dark:text-blue-100',
        };
    }
  }, [variant]);

  return (
    <div className={`flex rounded-md px-4 py-3 ${containerStyle}`}>
      <Text className={messageStyle}>{children}</Text>
    </div>
  );
};
