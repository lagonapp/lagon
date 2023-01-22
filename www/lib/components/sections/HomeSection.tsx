import { FunctionCode } from '../Code';
import { WorldSideImage } from '../images/WorldSideImage';
import { Text } from '../Text';
import { motion } from 'framer-motion';
import { Button } from '../Button';
import { useState } from 'react';
import { DESCRIPTION } from '../../constants';

export const HomeSection = () => {
  const [response, setResponse] = useState<{ text: string; time: number; region: string } | undefined>();
  const animate = [0, undefined].includes(response?.time) ? 'hidden' : 'visible';

  return (
    <section className="flex flex-col gap-24 relative mb-0 md:mb-36">
      <motion.div
        className="absolute -right-24 -top-28 hidden md:block pointer-events-none"
        initial={{ opacity: 0, right: -106, top: -102 }}
        animate={{ opacity: 1, right: -96, top: -112 }}
        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
      >
        <WorldSideImage />
        <div className="absolute top-[48%] right-[9%]">
          {response?.time ? (
            <motion.p
              className="text-grey opacity-50 text-xs absolute -top-4 left-6"
              variants={{
                hidden: {
                  opacity: 0,
                },
                visible: {
                  opacity: 0.5,
                },
              }}
              animate={animate}
            >
              Edge Function replied in {response.time}ms, from {response.region}
            </motion.p>
          ) : null}
          <FunctionCode onResponse={setResponse}>
            export function <span className="text-blue-1">handler</span>(request:&nbsp;
            <span className="text-purple">Request</span>) &#123;
            <br />
            &nbsp;&nbsp;const ip = request.headers.get(<span className="text-green">&apos;X-Forwarded-For&apos;</span>
            )
            <br />
            &nbsp;&nbsp;return new <span className="text-purple">Response</span>(
            <span className="text-green">`Your IP is: </span>
            {'${ip}'}
            <span className="text-green">`</span>)
            <br />
            &#125;
          </FunctionCode>
        </div>
        <motion.div
          className="absolute right-52 flex flex-col items-center gap-2"
          variants={{
            hidden: {
              opacity: 0,
              top: 342,
            },
            visible: {
              opacity: 1,
              top: 332,
            },
          }}
          animate={animate}
        >
          <p className="text-xs font-mono text-green">{response?.text}</p>
          <div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-b from-blue-1 to-[#1B76FF]" />
            <div className="w-[2px] h-1 rounded-full bg-grey ml-[3px] mt-[1px]" />
          </div>
        </motion.div>
      </motion.div>
      <div className="flex flex-col gap-16 z-10">
        <div className="flex flex-col gap-4">
          <motion.div
            className="max-w-4xl relative"
            initial={{ opacity: 0, top: 20 }}
            animate={{ opacity: 1, top: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Text size="h1" variant="linearGradiantGray">
              Deploy JavaScript Functions at the&nbsp;
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
                Edge
              </span>
              , in seconds
            </Text>
          </motion.div>
          <motion.div
            className="md:w-5/12 relative"
            initial={{ opacity: 0, top: 20 }}
            animate={{ opacity: 1, top: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <Text>{DESCRIPTION}</Text>
          </motion.div>
        </div>
        <motion.div
          className="flex gap-4 relative"
          initial={{ opacity: 0, top: 20 }}
          animate={{ opacity: 1, top: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
        >
          <Button variant="primary" size="lg" href="https://dash.lagon.app">
            Deploy now
          </Button>
          <Button variant="secondary" size="lg" href="#features" scroll={false}>
            Discover
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
