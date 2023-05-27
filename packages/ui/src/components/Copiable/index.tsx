import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';
import useClipboard from 'react-use-clipboard';

type CopiableProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

export const Copiable = ({ value, className, children }: CopiableProps) => {
  const [copied, copy] = useClipboard(value, {
    successDuration: 1000,
  });

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {children}
      {copied ? (
        <CheckIcon className="h-4 w-4 cursor-pointer" />
      ) : (
        <ClipboardIcon className="h-4 w-4 cursor-pointer" onClick={copy} />
      )}
    </div>
  );
};
