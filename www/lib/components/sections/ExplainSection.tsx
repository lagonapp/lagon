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
      <div className="flex flex-col gap-12 md:gap-16 lg:flex-row" ref={ref}>
        <div className="to-blue-1 hover:shadow-blue-1/40 group flex-1 rounded-3xl bg-gradient-to-br from-[#C9E2FF] p-[1px] transition duration-300 hover:shadow-2xl">
          <div className="bg-dark flex flex-col gap-4 rounded-3xl p-6 md:p-16">
            <div
              className="rounded-t-2xl p-[1px]"
              style={{ background: 'linear-gradient(rgb(37, 32, 46), rgba(37, 32, 46, 0)' }}
            >
              <div className="from-dark-gray to-dark h-80 rounded-t-2xl bg-gradient-to-b">
                <div style={{ borderColor: 'rgb(37, 32, 46)' }} className="flex gap-2 border-b p-4">
                  <span className="h-4 w-4 rounded-full bg-red-500" />
                  <span className="h-4 w-4 rounded-full bg-yellow-500" />
                  <span className="h-4 w-4 rounded-full bg-lime-500" />
                </div>
                <pre className="p-4">
                  <code className="text-grey font-mono text-sm">{text}</code>
                </pre>
              </div>
            </div>
            <div className="from-purple/10 to-blue-1/10 pointer-events-none absolute h-80 w-80 translate-x-[-30%] translate-y-[-30%] transform rounded-full bg-gradient-to-br opacity-0 blur-3xl transition duration-300 group-hover:opacity-100" />
            <Text size="h2">Deploy in seconds</Text>
            <Text paragraph>
              Your Deployments are live all around the world in a few seconds. Deploy with the CLI, the Playground on
              the Dashboard, or automate with a GitHub Action.
            </Text>
          </div>
        </div>
        <div className="to-blue-1 hover:shadow-blue-1/40 flex-1 rounded-3xl bg-gradient-to-br from-[#C9E2FF] p-[1px] transition duration-300 hover:shadow-2xl">
          <div className="bg-dark flex h-full flex-col justify-between rounded-3xl p-6 md:p-16">
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
