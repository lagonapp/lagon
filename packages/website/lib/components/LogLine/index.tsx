import { useMemo } from 'react';
import { LogLevel } from 'lib/types';

type LogLineProps = {
  date: Date;
  level?: LogLevel;
  message: string;
};

const LogLine = ({ date, level = 'info', message }: LogLineProps) => {
  const { containerStyle, dateStyle, messageStyle } = useMemo(() => {
    switch (level) {
      case 'error':
        return {
          containerStyle: 'bg-red-50 hover:bg-red-100',
          dateStyle: 'text-red-600',
          messageStyle: 'text-red-800',
        };
      case 'warn':
        return {
          containerStyle: 'bg-amber-50 hover:bg-amber-100',
          dateStyle: 'text-amber-600',
          messageStyle: 'text-amber-800',
        };
      default:
        return {
          containerStyle: 'even:bg-gray-50 hover:bg-gray-100',
          dateStyle: 'text-gray-600',
          messageStyle: 'text-gray-800',
        };
    }
  }, [level]);

  return (
    <div className={`flex justify-between w-full px-2 py-1 rounded-md group ${containerStyle}`}>
      <div className="flex items-start gap-4">
        <p className={`text-sm whitespace-pre w-36 ${dateStyle}`}>{date.toLocaleString('en-US')}</p>
        <pre className={`text-sm text-gray-800 whitespace-pre-wrap ${messageStyle}`}>{message}</pre>
      </div>
      <span
        className="hidden cursor-pointer group-hover:inline text-xs text-gray-400 hover:text-gray-800"
        onClick={() => navigator.clipboard.writeText(message)}
      >
        Copy
      </span>
    </div>
  );
};

export default LogLine;
