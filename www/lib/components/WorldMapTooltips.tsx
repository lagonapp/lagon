'use client';

import { motion } from 'framer-motion';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Tooltip } from './Tooltip';
import { ALL_REGIONS, Region } from '../constants';

type CityPointProps = Region & {
  i: number;
};

const CityPoint = ({ name, top, left, i }: CityPointProps) => {
  const initialTop = `${Number(top.replace('%', '')) - 1}%`;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
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

export const WorldMapTooltips = () => {
  return (
    <RadixTooltip.Provider skipDelayDuration={0} delayDuration={0}>
      {ALL_REGIONS.map((point, i) => (
        <CityPoint key={i} i={i} {...point} />
      ))}
    </RadixTooltip.Provider>
  );
};
