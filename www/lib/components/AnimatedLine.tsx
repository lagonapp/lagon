import { useRef, useEffect } from 'react';

type AnimatedLineProps = {
  size: 'small' | 'large';
};

export const AnimatedLine = ({ size }: AnimatedLineProps) => {
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (line.current) {
      const delay = (Math.random() * 3 + 3) * 1000;

      line.current.style.top = Math.random() * 50 + '%';
      line.current.style.left = Math.random() * 100 + '%';
      line.current.style.animation = `line-bottom-left ${delay}ms ease-in-out infinite`;

      const interval = setInterval(() => {
        if (line.current) {
          line.current.style.top = Math.random() * 100 + '%';
          line.current.style.left = Math.random() * 100 + '%';
        }
      }, delay);

      return () => {
        clearInterval(interval);
      };
    }
  }, [line, size]);

  if (size === 'small') {
    return (
      <div
        ref={line}
        className="absolute hidden h-32 w-[1px] rotate-45 transform opacity-0 lg:block"
        style={{ backgroundImage: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2))' }}
      />
    );
  }

  return (
    <div
      ref={line}
      className="absolute hidden h-40 w-[2px] rotate-[-135deg] transform opacity-0 lg:block"
      style={{ backgroundImage: 'linear-gradient(to bottom, transparent, #449AFF)' }}
    />
  );
};
