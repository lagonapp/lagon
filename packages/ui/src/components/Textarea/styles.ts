import { cva, cx } from 'class-variance-authority';

const base = cx([
  'px-3 py-1',
  'bg-white dark:bg-stone-900',
  'text-sm text-stone-800 dark:text-stone-200',
  'border border-stone-300 dark:border-stone-600 rounded-md',
]);

export const variants = cva(base, {
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
  },
});
