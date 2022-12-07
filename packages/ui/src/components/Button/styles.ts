import { cva } from 'class-variance-authority';

export const variants = cva('select-none whitespace-nowrap shadow-sm', {
  variants: {
    variant: {
      primary: [
        'text-white',
        'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
        'border border-blue-700',
        'shadow-blue-100 dark:shadow-blue-900',
      ],
      secondary: [
        'text-stone-800 dark:text-stone-200',
        'bg-stone-50 hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 dark:active:bg-stone-700',
        'border border-stone-300 dark:border-stone-600',
        'shadow-stone-100 dark:shadow-stone-900',
      ],
      danger: [
        'text-white',
        'bg-red-500 hover:bg-red-600 active:bg-red-700',
        'border border-red-700',
        'shadow-red-100 dark:shadow-red-900',
      ],
    },
    size: {
      sm: 'px-2 py-1 rounded text-xs',
      md: 'px-3 py-1 rounded-md text-sm',
      lg: 'px-4 py-2 rounded-lg text-md',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
    center: {
      true: 'justify-center',
    },
  },
});
