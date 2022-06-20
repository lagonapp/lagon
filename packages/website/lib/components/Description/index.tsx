import { ReactNode } from 'react';
import Text from 'lib/components/Text';

type TextProps = {
  title: string;
  total?: string | number;
  children: ReactNode;
};

const Description = ({ title, total, children }: TextProps) => {
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

export default Description;
