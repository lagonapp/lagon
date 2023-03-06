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
    <section className="relative flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.a
          href="/blog/unveiling-the-new-website"
          className="text-grey bg-dark-gray hover:bg-blue-3 z-10 inline-flex gap-2 rounded-full px-4 py-2 text-base transition hover:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Unveiling the new website <ArrowRightIcon />
        </motion.a>
        <motion.div
          className="relative max-w-2xl"
          initial={{ opacity: 0, top: 20 }}
          animate={{ opacity: 1, top: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Text size="h1" variant="radialGradientWhite">
            Deploy Serverless Functions at the&nbsp;
            <span className="from-green to-purple bg-gradient-to-r via-[#5A7ACB] bg-clip-text text-transparent">
              Edge
            </span>
          </Text>
        </motion.div>
        <motion.div
          className="relative max-w-md"
          initial={{ opacity: 0, top: 20 }}
          animate={{ opacity: 1, top: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <Text>{DESCRIPTION}</Text>
        </motion.div>
      </div>
      <motion.div
        className="relative flex gap-4"
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
        className="pointer-events-none absolute hidden -translate-y-40 transform md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <WorldBottomImage />
      </motion.div>
      <motion.div
        className="mt-44 hidden flex-col items-center md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="h-12 border-l border-dashed border-[#86B6FF]" />
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
            className="text-grey absolute bottom-2 text-xs opacity-50"
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
          className="absolute left-[35%] flex -translate-x-1/2 transform flex-col items-center gap-2"
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
          <p className="text-green font-mono text-xs">{response?.text}</p>
          <div>
            <div className="from-blue-1 h-2 w-2 rounded-full bg-gradient-to-b to-[#1B76FF]" />
            <div className="bg-grey ml-[3px] mt-[1px] h-1 w-[2px] rounded-full" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
