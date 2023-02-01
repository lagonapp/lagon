import { ALL_REGIONS, Region, REGIONS } from '../../constants';
import { Button } from '../Button';
import { WorldMapImage } from '../images/WorldMapImage';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';
import { motion } from 'framer-motion';

type CityPointProps = Region & {
  i: number;
};

const CityPoint = ({ name, top, left, i }: CityPointProps) => {
  const initialTop = `${Number(top.replace('%', '')) - 1}%`;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
      initial={{ opacity: 0, top: initialTop, left }}
      whileInView={{ opacity: 1, top, left }}
      transition={{ delay: i / 10, type: 'tween' }}
      viewport={{ once: true }}
    >
      <Tooltip content={name} aria-label={`Pin located in ${name}, representing a Lagon Edge Region`}>
        <div className="from-blue-1 h-2 w-2 rounded-full bg-gradient-to-b to-[#1B76FF]" />
        <div className="bg-grey ml-[3px] mt-[1px] h-1 w-[2px] rounded-full" />
      </Tooltip>
    </motion.div>
  );
};

export const EdgeNetworkSection = () => {
  return (
    <section className="flex flex-col justify-center">
      <motion.div
        className="z-10 mx-auto flex w-3/4 flex-col items-center gap-4 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Text size="h2">
          A growing&nbsp;
          <span className="from-green to-purple bg-gradient-to-r via-[#5A7ACB] bg-clip-text text-transparent">
            Edge Network
          </span>
        </Text>
        <Text>{REGIONS} regions allowing minimal latency all around the world.</Text>
      </motion.div>
      <div className="relative md:-mt-16">
        <WorldMapImage />
        {ALL_REGIONS.map((point, i) => (
          <CityPoint key={i} i={i} {...point} />
        ))}
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
