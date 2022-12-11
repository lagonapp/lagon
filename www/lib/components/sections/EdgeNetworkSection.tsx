import { ALL_REGIONS, Region, REGIONS } from '../../constants';
import { Button } from '../Button';
import { WorldMapImage } from '../images/WorldMapImage';
import { Text } from '../Text';
import { Tooltip } from '../Tooltip';

const CityPoint = ({ name, top, left }: Region) => {
  return (
    <div className="absolute" style={{ top: `${top}px`, left: `${left}px` }}>
      <Tooltip content={name}>
        <div className="w-2 h-2 rounded-full bg-gradient-to-b from-blue-1 to-[#1B76FF]" />
        <div className="w-[2px] h-1 rounded-full bg-grey ml-[3px] mt-[1px]" />
      </Tooltip>
    </div>
  );
};

export const EdgeNetworkSection = () => {
  return (
    <section className="relative">
      <WorldMapImage />
      {ALL_REGIONS.map((point, i) => (
        <CityPoint key={i} {...point} />
      ))}
      <div className="flex flex-col items-center gap-4 absolute top-0 left-1/2 transform -translate-x-1/2">
        <Text size="h2">
          A growing&nbsp;
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
            Edge Network
          </span>
        </Text>
        <Text>{REGIONS} regions allowing minimal lantency all around the world</Text>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <Button variant="primary" size="lg">
          Start deploying
        </Button>
      </div>
    </section>
  );
};
