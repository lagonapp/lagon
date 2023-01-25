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
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, top: initialTop, left }}
      whileInView={{ opacity: 1, top, left }}
      transition={{ delay: i / 10, type: 'tween' }}
      viewport={{ once: true }}
    >
      <Tooltip content={name} aria-label={`Pin located in ${name}, representing a Lagon Edge Region`}>
        <div className="w-2 h-2 rounded-full bg-gradient-to-b from-blue-1 to-[#1B76FF]" />
        <div className="w-[2px] h-1 rounded-full bg-grey ml-[3px] mt-[1px]" />
      </Tooltip>
    </motion.div>
  );
};

export const EdgeNetworkSection = () => {
  return (
    <section className="flex justify-center flex-col">
      <motion.div
        className="flex text-center flex-col items-center gap-4 w-3/4 mx-auto z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Text size="h2">
          A growing&nbsp;
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
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
      <div className="flex flex-wrap justify-center gap-4 w-full md:-mt-16 z-10">
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
