import { ReactNode, useRef, useState } from 'react';
import { Button } from './Button';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';

type CodeProps = {
  onResponse: (response?: { text: string; time: number; region: string }) => void;
  children: ReactNode;
};

export const FunctionCode = ({ onResponse, children }: CodeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();

  const handleClick = async () => {
    if (isLoading || !!timeout.current) return;

    setIsLoading(true);

    const now = Date.now();
    const response = await fetch('https://whatismyip.lagon.app');
    const region = response.headers.get('x-lagon-region') ?? 'Unknown';
    const text = await response.text();
    const time = Date.now() - now;

    onResponse({
      text,
      time,
      region,
    });

    timeout.current = setTimeout(() => {
      onResponse({
        text,
        time: 0,
        region,
      });

      timeout.current = undefined;
    }, 3000);

    setIsLoading(false);
  };

  return (
    <Card className="bg-dark pointer-events-auto rounded-2xl p-6">
      <pre>
        <code className="text-grey font-mono text-sm">{children}</code>
      </pre>
      <div className="absolute -bottom-2 -right-2">
        <Button variant="primary" onClick={handleClick} aria-label="Run example Edge Function to get your IP address">
          {isLoading ? (
            <ArrowPathIcon className="h-5 w-5" strokeWidth="1" />
          ) : (
            <PlayIcon className="h-5 w-5" strokeWidth="1" />
          )}
        </Button>
      </div>
    </Card>
  );
};
