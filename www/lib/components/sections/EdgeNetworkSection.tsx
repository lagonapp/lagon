import { ALL_REGIONS, Region, REGIONS } from '../../constants';
import { Button } from '../Button';
import { WorldMapImage } from '../images/WorldMapImage';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';
import { motion } from 'framer-motion';

const CityPoint = ({ name, top, left }: Region) => {
  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, top: top - 20, left }}
      whileInView={{ opacity: 1, top, left }}
      transition={{ delay: Math.random() * 1.2 + 0.4, type: 'tween' }}
      viewport={{ once: true }}
    >
      <Tooltip content={name}>
        <div className="w-2 h-2 rounded-full bg-gradient-to-b from-blue-1 to-[#1B76FF]" />
        <div className="w-[2px] h-1 rounded-full bg-grey ml-[3px] mt-[1px]" />
      </Tooltip>
    </motion.div>
  );
};

export const EdgeNetworkSection = () => {
  return (
    <section className="relative flex justify-center">
      <WorldMapImage />
      <div className="absolute w-full h-full">
        {ALL_REGIONS.map((point, i) => (
          <CityPoint key={i} {...point} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 absolute -top-8 left-1/2 transform -translate-x-1/2 w-full">
        <Text size="h2">
          A growing&nbsp;
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
            Edge Network
          </span>
        </Text>
        <Text>{REGIONS} regions allowing minimal latency all around the world.</Text>
      </div>
      <div className="flex justify-center gap-4 absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full">
        <Button variant="primary" size="lg" href="https://dash.lagon.app">
          Start deploying
        </Button>
        <Button variant="tertiary" size="lg" href="https://tally.so/r/mDqAYN" target="_blank">
          Request a new Region
        </Button>
      </div>
    </section>
  );
};
