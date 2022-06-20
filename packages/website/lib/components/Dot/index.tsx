import { useMemo } from 'react';

type DotProps = {
  status: 'success' | 'info' | 'danger';
};

const Dot = ({ status }: DotProps) => {
  const { ringColor, centerColor } = useMemo(() => {
    switch (status) {
      case 'success':
        return {
          ringColor: 'bg-green-400',
          centerColor: 'bg-green-500',
        };
      case 'info':
        return {
          ringColor: 'bg-blue-400',
          centerColor: 'bg-blue-500',
        };
      case 'danger':
        return {
          ringColor: 'bg-red-400',
          centerColor: 'bg-red-500',
        };
    }
  }, [status]);

  return (
    <span className="h-3 w-3 relative inline-flex mr-4 align-middle">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ringColor}`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${centerColor}`} />
    </span>
  );
};

export default Dot;
