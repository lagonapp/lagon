import { ReactNode, useEffect, useRef } from 'react';

type CardProps = {
  className?: string;
  lineAnimation?: boolean;
  children: ReactNode;
};

export const Card = ({ className, lineAnimation, children }: CardProps) => {
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lineAnimation && line.current) {
      line.current.style.top = Math.random() * 50 + '%';
      line.current.style.left = Math.random() * 50 + '%';

      const interval = setInterval(() => {
        if (line.current) {
          const top = Number(line.current.style.top.replace('%', ''));
          const left = Number(line.current.style.left.replace('%', ''));

          if (top >= 100 || left >= 100) {
            line.current.style.top = Math.random() * 50 + '%';
            line.current.style.left = Math.random() * 50 + '%';
          } else {
            line.current.style.top = top + 1 + '%';
            line.current.style.left = left - 1 + '%';
          }
        }
      }, 50);

      return () => {
        clearInterval(interval);
      };
    }
  }, [lineAnimation, line]);

  return (
    <div
      className="p-[1px] rounded-2xl relative"
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent)' }}
    >
      <div
        className={`h-full ${className}`}
        style={{ backgroundImage: 'linear-gradient(to bottom, #110C1F, rgba(17, 12, 31, 0.5))' }}
      >
        {children}
      </div>
      {lineAnimation ? (
        <div
          ref={line}
          className="absolute transform rotate-45 w-[1px] h-32"
          style={{ backgroundImage: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2))' }}
        />
      ) : null}
    </div>
  );
};
