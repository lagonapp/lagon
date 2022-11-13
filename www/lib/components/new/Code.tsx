import { ReactNode } from 'react';
import { Button } from './Button';
import { PlayIcon } from '@heroicons/react/outline';

type CodeProps = {
  children: ReactNode;
};

export const Code = ({ children }: CodeProps) => {
  return (
    <div
      className="p-[1px] rounded-2xl -mt-8"
      style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), transparent)' }}
    >
      <div
        className="bg-dark p-6 rounded-2xl relative"
        style={{ backgroundImage: 'linear-gradient(to bottom, #110C1F, rgba(17, 12, 31, 0.5))' }}
      >
        <pre>
          <code className="font-mono text-sm text-grey">{children}</code>
        </pre>
        <div className="absolute -bottom-2 -right-2">
          <Button variant="primary">
            <PlayIcon className="w-6 h-6" strokeWidth="1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
