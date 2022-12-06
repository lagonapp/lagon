import { cva, cx } from 'class-variance-authority';

const base = cx([
  'bg-white dark:bg-stone-900',
  'px-3 py-1',
  'text-sm text-stone-800 dark:text-stone-200',
  'rounded-md border border-stone-300 dark:border-stone-600',
]);

export const variants = cva(base, {
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
  },
});
