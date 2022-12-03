import { ReactNode } from 'react';
import { Text } from '../';

type TextProps = {
  title: string;
  total?: string | number;
  children: ReactNode;
};

export const Description = ({ title, total, children }: TextProps) => {
  return (
    <div>
      <Text>{title}:</Text>
      <Text size="lg">
        {children}
        {total ? (
          <>
            <Text size="sm">/{total}</Text>
          </>
        ) : null}
      </Text>
    </div>
  );
};
