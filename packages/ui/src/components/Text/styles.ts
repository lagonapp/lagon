import { cva } from 'class-variance-authority';

export const variants = cva(null, {
  variants: {
    size: {
      sm: 'text-xs text-stone-500 dark:text-stone-500',
      md: 'text-sm text-stone-800 dark:text-stone-400',
      lg: 'text-lg text-stone-900 dark:text-stone-50',
      xl: 'text-xl text-stone-900 dark:text-stone-50 font-semibold',
      '2xl': 'text-2xl text-stone-900 dark:text-stone-50 font-semibold',
    },
    strong: {
      true: 'font-semibold',
    },
    error: {
      true: '!text-red-500 !dark:text-red-500',
    },
  },
});
