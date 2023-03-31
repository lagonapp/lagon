'use client';

import { useEffect, useRef, useState } from 'react';

const TERMINAL: { text: string; write?: boolean }[] = [
  {
    text: '$ lagon deploy ./index.ts',
    write: true,
  },
  {
    text: '\nDeploying Function...',
  },
  {
    text: 'Done!\n\n',
  },
  {
    text: '$ curl https://test.lagon.dev',
    write: true,
  },
  {
    text: 'Hello World!',
  },
];

export const DeploymentWidget = () => {
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const textIndex = useRef(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (step === TERMINAL.length) {
      timeout = setTimeout(() => {
        setText('');
        setStep(0);
      }, 2000);

      return;
    }

    const { text: newText, write } = TERMINAL[step];

    timeout = setTimeout(
      () => {
        if (write) {
          setText(`${text}${newText[textIndex.current]}`);
          textIndex.current += 1;

          if (textIndex.current === newText.length) {
            setStep(step + 1);
            textIndex.current = 0;
          }
        } else {
          setText(`${text}\n${newText}`);
          setStep(step + 1);
        }
      },
      write ? 40 : 500,
    );

    return () => clearTimeout(timeout);
  }, [step, text]);

  return (
    <pre className="p-4">
      <code className="text-grey font-mono text-sm">{text}</code>
    </pre>
  );
};
