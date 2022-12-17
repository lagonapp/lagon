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
        <Text className="justify-self-end">
          All Functions have an HTTP endpoint by default, and you can also configure a CRON expression to automatically
          trigger your Function at the given interval.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
          <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
            <RollbackIcon />
          </div>
        </div>
        <Text size="h3">Rollback in seconds</Text>
        <Text>
          You can promote any previous Preview deployment to Production with a single click. The rollback is propagated
          globally in a few seconds.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
          <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
            <StatsIcon />
          </div>
        </div>
        <Text size="h3">Analytics and logs</Text>
        <Text>
          View detailed analytics with requests, CPU/memory, and HTTP traffic graphs. Debug your Functions with
          real-time logs.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
          <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
            <APIsIcon />
          </div>
        </div>
        <Text size="h3">Build on Web APIs</Text>
        <Text>
          No need to learn new things - we use the same Web APIs you already know like Request and Response, so you can
          build faster with no vendor lock-in.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
          <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
            <DollarIcon />
          </div>
        </div>
        <Text size="h3">Only pay for what you use</Text>
        <Text>
          Get a generous free tier, and then only pay for the number of requests your Functions receive. No need to
          worry about scaling.
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
          Lagon is fully open-source and built in the open, focusing on the community. Use our Cloud platform, or
          self-host it yourself.
        </Text>
      </Card>
    </section>
  );
};
