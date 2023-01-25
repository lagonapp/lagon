import { FunctionCode } from '../Code';
import { Text } from '../Text';
import { motion } from 'framer-motion';
import { Button } from '../Button';
import { useState } from 'react';
import { DESCRIPTION } from '../../constants';
import { WorldBottomImage } from '../images/WorldBottomImage';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

export const HomeSection = () => {
  const [response, setResponse] = useState<{ text: string; time: number; region: string } | undefined>();
  const animate = [0, undefined].includes(response?.time) ? 'hidden' : 'visible';

  return (
    <section className="flex flex-col gap-8 items-center justify-center relative">
      <div className="flex flex-col gap-4 text-center items-center">
        <motion.a
          href="https://tally.so/r/n9q1Rp"
          target="_blank"
          className="text-grey text-base px-4 py-2 rounded-full bg-dark-gray hover:bg-blue-3 hover:text-white transition z-10 inline-flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Lagon is in Alpha! <ArrowRightIcon />
        </motion.a>
        <motion.div
          className="max-w-2xl relative"
          initial={{ opacity: 0, top: 20 }}
          animate={{ opacity: 1, top: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Text size="h1" variant="radialGradientWhite">
            Deploy JavaScript Functions at the&nbsp;
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
              Edge
            </span>
          </Text>
        </motion.div>
        <motion.div
          className="relative max-w-sm"
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
        <Button variant="primary" size="lg" href="https://tally.so/r/n9q1Rp" target="_blank">
          Join the waitlist
        </Button>
        <Button variant="secondary" size="lg" href="#features" scroll={false}>
          Discover
        </Button>
      </motion.div>
      <motion.div
        className="absolute transform -translate-y-40 pointer-events-none hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <WorldBottomImage />
      </motion.div>
      <motion.div
        className="hidden md:flex flex-col items-center mt-44"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="border-l border-dashed border-[#86B6FF] h-12" />
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
        {response?.time ? (
          <motion.p
            className="text-grey opacity-50 text-xs absolute bottom-2"
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
        <motion.div
          className="absolute transform -translate-x-1/2 left-[35%] flex flex-col items-center gap-2"
          variants={{
            hidden: {
              opacity: 0,
              top: 407,
            },
            visible: {
              opacity: 1,
              top: 397,
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
    </section>
  );
};
