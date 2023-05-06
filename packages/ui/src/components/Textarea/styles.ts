import { cva } from 'class-variance-authority';

export const variants = cva(
  [
    'px-3 py-1',
    'bg-white dark:bg-stone-900',
    'text-sm text-stone-800 dark:text-stone-200',
    'border border-stone-300 dark:border-stone-600 rounded-md',
  ],
  {
    variants: {
      disabled: {
        true: 'cursor-not-allowed opacity-50',
      },
    },
  },
);
