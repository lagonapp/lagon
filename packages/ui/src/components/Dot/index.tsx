import { useMemo } from 'react';
import { cx } from 'class-variance-authority';

type DotProps = {
  status: 'success' | 'info' | 'danger';
};

export const Dot = ({ status }: DotProps) => {
  const { ringColor, centerColor } = useMemo(() => {
    switch (status) {
      case 'success':
        return {
          ringColor: 'bg-green-400',
          centerColor: 'bg-green-500',
        };
      case 'info':
        return {
          ringColor: 'bg-blue-400',
          centerColor: 'bg-blue-500',
        };
      case 'danger':
        return {
          ringColor: 'bg-red-400',
          centerColor: 'bg-red-500',
        };
    }
  }, [status]);

  return (
    <span className="relative mr-4 inline-flex h-3 w-3 align-middle">
      <span className={cx(['absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', ringColor])} />
      <span className={cx(['relative inline-flex h-3 w-3 rounded-full', centerColor])} />
    </span>
  );
};
