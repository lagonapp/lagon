import { cva } from 'class-variance-authority';

export const variants = cva(
  [
    'bg-white dark:bg-stone-900',
    'px-1.5 py-0.5 flex items-center',
    'rounded-md border border-stone-300 dark:border-stone-600',
    'focus-within:outline-1 focus-within:outline-blue-500 focus-within:outline-offset-2',
  ],
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-50',
      },
    },
  },
);
