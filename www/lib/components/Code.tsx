import { ReactNode, useState } from 'react';
import { Button } from './Button';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card } from './Card';

type CodeProps = {
  children: ReactNode;
};

export const FunctionCode = ({ children }: CodeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ text: string; time: number }>();

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const now = Date.now();
    const response = await fetch('https://whatismyip.lagon.app');
    const text = await response.text();
    const time = Date.now() - now;

    setResponse({
      text,
      time,
    });

    setIsLoading(false);

    setTimeout(() => setResponse(undefined), 5000);
  };

  return (
    <Card className="bg-dark p-6 rounded-2xl">
      <pre>
        <code className="font-mono text-sm text-grey">
          {children}
          {isLoading ? (
            <>
              <br />
              <br />
              ...
            </>
          ) : null}
          {response ? (
            <>
              <br />
              <br />
              {'//'} Duration: {response.time}ms
              <br />
              {response.text}
            </>
          ) : null}
        </code>
      </pre>
      <div className="absolute -bottom-2 -right-2">
        <Button variant="primary" onClick={handleClick}>
          {isLoading ? (
            <ArrowPathIcon className="w-5 h-5" strokeWidth="1" />
          ) : (
            <PlayIcon className="w-5 h-5" strokeWidth="1" />
          )}
        </Button>
      </div>
    </Card>
  );
};
