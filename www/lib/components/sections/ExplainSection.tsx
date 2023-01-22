import { useEffect, useRef, useState } from 'react';
import { RunButtonImage } from '../images/RunButtonImage';
import { Text } from '../Text';
import { useInView } from 'framer-motion';

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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (!inView) return;

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
  }, [step, text, inView]);

  return (
    <section id="features" className="pt-20">
      <div className="flex flex-col lg:flex-row md:gap-16 gap-12" ref={ref}>
        <div className="flex-1 p-[1px] rounded-3xl bg-gradient-to-br from-[#C9E2FF] to-blue-1 transition duration-300 hover:shadow-2xl hover:shadow-blue-1/40 group">
          <div className="bg-dark rounded-3xl flex flex-col gap-4 md:p-16 p-6">
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
            <div className="transition duration-300 opacity-0 group-hover:opacity-100 w-80 h-80 absolute rounded-full transform translate-x-[-30%] translate-y-[-30%] pointer-events-none bg-gradient-to-br from-purple/10 to-blue-1/10 blur-3xl" />
            <Text size="h2">Deploy in seconds</Text>
            <Text paragraph>
              Your Deployments are live all around the world in a few seconds. Deploy with the CLI, the Playground on
              the Dashboard, or automate with a GitHub Action.
            </Text>
          </div>
        </div>
        <div className="flex-1 p-[1px] rounded-3xl bg-gradient-to-br from-[#C9E2FF] to-blue-1 transition duration-300 hover:shadow-2xl hover:shadow-blue-1/40">
          <div className="bg-dark rounded-3xl flex flex-col md:p-16 p-6 h-full justify-between">
            <RunButtonImage />
            <div className="flex flex-col gap-4">
              <Text size="h2">2ms cold starts</Text>
              <Text>
                Lagon&apos;s Runtime is written in Rust and uses V8, Chrome&apos;s JavaScript engine. Your Functions
                start in single-digit milliseconds and stay warm for subsequent requests.
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
