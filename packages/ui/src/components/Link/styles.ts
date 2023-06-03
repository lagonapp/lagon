import { cva } from 'class-variance-authority';

export const variants = cva(
  [
    'flex items-center gap-1 whitespace-nowrap',
    'text-sm text-blue-500 hover:text-blue-600',
    'dark:text-blue-400 dark:hover:text-blue-500'
  ],
  {
    variants: {
      inline: {
        true: 'inline-flex',
      },
    },
  },
);
