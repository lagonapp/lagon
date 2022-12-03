import { useEffect, useRef } from 'react';

export const Star = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Generate a random number with high chances of being between 30 and 70,
    // and low chances of being between 0 and 100.
    function getPosition() {
      const rand = Math.random() * 100;

      if (rand < 30) {
        return Math.random() * 100;
      } else {
        return Math.random() * 40 + 30;
      }
    }

    const x = getPosition();
    const y = getPosition();
    const size = Math.random() * 2;
    const duration = Math.random() * 5 + 5;

    ref.current.style.top = `${y}%`;
    ref.current.style.left = `${x}%`;
    ref.current.style.width = `${1 + size}px`;
    ref.current.style.height = `${1 + size}px`;
    ref.current.style.animation = `star ${duration}s ease-in infinite`;
  }, [ref]);

  return <span ref={ref} className="absolute rounded-full bg-white" />;
};
