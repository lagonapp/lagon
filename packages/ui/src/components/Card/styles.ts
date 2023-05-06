import { cva } from 'class-variance-authority';

export const variants = cva(
  [
    'p-4 rounded-md transition',
    'bg-white dark:bg-stone-900',
    'shadow-md shadow-stone-200 dark:shadow-none',
    'flex flex-col gap-4',
  ],
  {
    variants: {
      clickable: {
        true: 'cursor-pointer hover:shadow-stone-300 dark:hover:shadow-stone-700',
      },
      danger: {
        true: 'border border-red-500',
      },
    },
  },
);
