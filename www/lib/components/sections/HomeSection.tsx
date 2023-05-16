import { Text } from '../Text';
import { MotionDiv, MotionA } from '../../client';
import { Button } from '../Button';
import { DESCRIPTION } from '../../constants';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { CodeWidget } from '../CodeWidget';

export const HomeSection = () => {
  return (
    <section className="relative flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <MotionA
          href="/blog/announcing-lagon-alpha"
          className="text-grey bg-dark-gray hover:bg-blue-3 z-10 inline-flex gap-2 rounded-full px-4 py-2 text-base transition hover:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Announcing Lagon Alpha <ArrowRightIcon />
        </MotionA>
        <MotionDiv
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
        </MotionDiv>
        <MotionDiv
          className="relative max-w-md"
          initial={{ opacity: 0, top: 20 }}
          animate={{ opacity: 1, top: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <Text>{DESCRIPTION}</Text>
        </MotionDiv>
      </div>
      <MotionDiv
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
      </MotionDiv>
      <MotionDiv
        className="pointer-events-none absolute hidden -translate-y-40 transform md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <img src="/images/world-bottom.svg" alt="Image of the earth" />
      </MotionDiv>
      <MotionDiv
        className="mt-44 hidden flex-col items-center md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="h-12 border-l border-dashed border-[#86B6FF]" />
        <CodeWidget />
      </MotionDiv>
    </section>
  );
};
