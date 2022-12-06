import { cva, cx } from 'class-variance-authority';

const base = cx([
  'p-4 rounded-md transition',
  'bg-white dark:bg-stone-900',
  'shadow-md shadow-stone-200 dark:shadow-stone-800',
  'flex flex-col gap-4',
]);

export const variants = cva(base, {
  variants: {
    clickable: {
      true: 'cursor-pointer hover:shadow-stone-300 dark:hover:shadow-stone-700',
    },
    danger: {
      true: 'border border-red-500',
    },
  },
});
