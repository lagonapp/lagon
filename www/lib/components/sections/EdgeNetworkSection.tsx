import { REGIONS } from '../../constants';
import { Button } from '../Button';
import { Text } from '../Text';
import { MotionDiv } from '../../client';
import { WorldMapTooltips } from '../WorldMapTooltips';

export const EdgeNetworkSection = () => {
  return (
    <section className="flex flex-col justify-center">
      <MotionDiv
        className="z-10 mx-auto flex w-3/4 flex-col items-center gap-4 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Text size="h2" className="text-white">
          A growing&nbsp;
          <span className="from-green to-purple bg-gradient-to-r via-[#5A7ACB] bg-clip-text text-transparent">
            Edge Network
          </span>
        </Text>
        <Text>{REGIONS} regions allowing minimal latency all around the world.</Text>
      </MotionDiv>
      <div className="relative md:-mt-16">
        <img src="/images/world-map.svg" alt="Map of the world" loading="lazy" />
        <WorldMapTooltips />
      </div>
      <div className="z-10 flex w-full flex-wrap justify-center gap-4 md:-mt-16">
        <Button variant="primary" size="lg" href="https://tally.so/r/n9q1Rp" target="_blank">
          Join the waitlist
        </Button>
        <Button variant="tertiary" size="lg" href="https://tally.so/r/mDqAYN" target="_blank">
          Request a new Region
        </Button>
      </div>
    </section>
  );
};
