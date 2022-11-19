import { ReactNode } from 'react';
import { Text } from './Text';

type BadgeProps = {
  children: ReactNode;
};

export const Badge = ({ children }: BadgeProps) => {
  return (
    <div
      className="p-[1px] rounded-full relative"
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent)' }}
    >
      <div
        className="h-full rounded-full px-4 py-2"
        style={{ backgroundImage: 'linear-gradient(to bottom, #110C1F, rgba(17, 12, 31, 0.5))' }}
      >
        <Text>{children}</Text>
      </div>
    </div>
  );
};
