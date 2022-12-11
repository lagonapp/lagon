import { useEffect, useRef, useState } from 'react';
import { REGIONS } from '../../constants';
import { RunButtonImage } from '../images/RunButtonImage';
import { TechnologiesWorldImage } from '../images/TechnologiesWorldImage';
import { Text } from '../Text';

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
    text: '$ curl https://test.lagon.app',
    write: true,
  },
  {
    text: 'Hello World!',
  },
];

export const ExplainSection = () => {
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
    <section id="features" className="flex flex-col gap-16">
      <div
        className="p-[1px] rounded-3xl"
        style={{
          background: 'linear-gradient(to bottom right, #44FFB0, #5A7ACB, #A449FF, #0D2A54)',
        }}
      >
        <div
          className="rounded-3xl flex justify-between items-center"
          style={{ backgroundImage: 'linear-gradient(to bottom, rgba(5, 2, 17, 0.8), rgb(5, 2, 17))' }}
        >
          <div className="mx-16 my-16 xl:my-0 flex flex-col gap-4 xl:max-w-[40%]">
            <Text size="h2">Run TypeScript and JavaScript in {REGIONS} regions</Text>
            <Text paragraph>
              Your Functions are replicated at the Edge in a growing list of {REGIONS} regions, so your users always get
              a fast response anywhere in the world.
            </Text>
          </div>
          <TechnologiesWorldImage />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="flex-1 p-[1px] rounded-3xl bg-gradient-to-br from-[#C9E2FF] to-blue-1">
          <div className="bg-dark rounded-3xl flex flex-col gap-4 p-16">
            <div
              className="p-[1px] rounded-t-2xl"
              style={{ background: 'linear-gradient(rgb(37, 32, 46), rgba(37, 32, 46, 0)' }}
            >
              <div className="rounded-t-2xl bg-gradient-to-b from-dark-gray to-dark h-80">
                <div style={{ borderColor: 'rgb(37, 32, 46)' }} className="p-4 flex gap-2 border-b">
                  <span className="w-4 h-4 bg-red-500 rounded-full" />
                  <span className="w-4 h-4 bg-yellow-500 rounded-full" />
                  <span className="w-4 h-4 bg-lime-500 rounded-full" />
                </div>
                <pre className="p-4">
                  <code className="font-mono text-sm text-grey">{text}</code>
                </pre>
              </div>
            </div>
            <Text size="h2">Deploy in seconds</Text>
            <Text paragraph>
              Using the Command-line Interface (CLI), the Playground on the Dashboard, or the GitHub Action, your
              Deployments are live all around the world in a few seconds.
            </Text>
          </div>
        </div>
        <div className="flex-1 p-[1px] rounded-3xl bg-gradient-to-br from-[#C9E2FF] to-blue-1">
          <div className="bg-dark rounded-3xl flex flex-col p-16 h-full justify-between">
            <RunButtonImage />
            <div className="flex flex-col gap-4">
              <Text size="h2">(Almost) no cold start</Text>
              <Text>
                Using the V8 engine from Chromium, your Functions starts almost instantly in single-digit milliseconds,
                and stays warm for subsequent requests.
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
