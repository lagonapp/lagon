import { ReactNode } from 'react';
import { Button } from './Button';
import { PlayIcon } from '@heroicons/react/outline';
import { Card } from './Card';

type CodeProps = {
  children: ReactNode;
};

export const Code = ({ children }: CodeProps) => {
  return (
    <Card className="bg-dark p-6 rounded-2xl">
      <pre>
        <code className="font-mono text-sm text-grey">{children}</code>
      </pre>
      <div className="absolute -bottom-2 -right-2">
        <Button variant="primary">
          <PlayIcon className="w-6 h-6" strokeWidth="1" />
        </Button>
      </div>
    </Card>
  );
};
