import { Card } from '../Card';
import { APIsIcon } from '../icons/APIsIcon';
import { DollarIcon } from '../icons/DollarIcon';
import { RollbackIcon } from '../icons/RollbackIcon';
import { StatsIcon } from '../icons/StatsIcon';
import { WorldIcon } from '../icons/WorldIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { Text } from '../Text';

export const CardsSection = () => {
  return (
    <section className="grid gap-6 grid-cols-1 grid-rows-6 sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#8dc2fb] to-[#446EFF]">
          <div className="rounded-full bg-gradient-to-b from-blue-1 to-[#446EFF] flex items-center justify-center h-full">
            <WorldIcon />
          </div>
        </div>
        <Text size="h3">Trigger via HTTP or CRON</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
          <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
            <RollbackIcon />
          </div>
        </div>
        <Text size="h3">Rollback to any deployment in seconds</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
          <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
            <StatsIcon />
          </div>
        </div>
        <Text size="h3">Statistics and real-time logs</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
          <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
            <APIsIcon />
          </div>
        </div>
        <Text size="h3">Use the Web APIs you know</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
          <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
            <DollarIcon />
          </div>
        </div>
        <Text size="h3">Pay only for what you use</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#8dc2fb] to-[#446EFF]">
          <div className="rounded-full bg-gradient-to-b from-blue-1 to-[#446EFF] flex items-center justify-center h-full">
            <HeartIcon />
          </div>
        </div>
        <Text size="h3">We love Open Source</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
    </section>
  );
};
