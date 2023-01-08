import { cx } from 'class-variance-authority';
import { useMemo } from 'react';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'all'] as const;
type LogLevel = typeof LOG_LEVELS[number];

type LogLineProps = {
  date: Date;
  level?: LogLevel;
  message: string;
};

export const LogLine = ({ date, level = 'info', message }: LogLineProps) => {
  const { containerStyle, dateStyle, messageStyle } = useMemo(() => {
    switch (level) {
      case 'error':
        return {
          containerStyle: 'bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800',
          dateStyle: 'text-red-600 dark:text-red-400',
          messageStyle: 'text-red-800 dark:text-red-200',
        };
      case 'warn':
        return {
          containerStyle: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900 dark:hover:bg-amber-800',
          dateStyle: 'text-amber-600 dark:text-amber-400',
          messageStyle: 'text-amber-800 dark:text-amber-200',
        };
      default:
        return {
          containerStyle:
            'even:bg-stone-50 hover:bg-stone-100 dark:even:bg-stone-900 dark:bg-dark dark:hover:bg-stone-800',
          dateStyle: 'text-stone-600 dark:text-stone-400',
          messageStyle: 'text-stone-800 dark:text-stone-200',
        };
    }
  }, [level]);

  return (
    <div className={cx(['flex justify-between w-full px-2 py-1 rounded-md group', containerStyle])}>
      <div className="flex items-start gap-4">
        <p className={cx(['text-sm whitespace-pre w-36', dateStyle])}>{date.toLocaleString('en-US')}</p>
        <pre className={cx(['text-sm whitespace-pre-wrap', messageStyle])}>{message}</pre>
      </div>
      <span
        className="hidden cursor-pointer group-hover:inline text-xs text-stone-400 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
        onClick={() => navigator.clipboard.writeText(message)}
      >
        Copy
      </span>
    </div>
  );
};
