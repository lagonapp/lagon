import { ReactNode } from 'react';
import { AnimatedLine } from './AnimatedLine';

type CardProps = {
  className?: string;
  lineAnimation?: boolean;
  children: ReactNode;
};

export const Card = ({ className, lineAnimation, children }: CardProps) => {
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
      {lineAnimation ? <AnimatedLine size="small" /> : null}
    </div>
  );
};
