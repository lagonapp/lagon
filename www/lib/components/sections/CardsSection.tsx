import { Card } from '../Card';
import { APIsIcon } from '../icons/APIsIcon';
import { DollarIcon } from '../icons/DollarIcon';
import { RollbackIcon } from '../icons/RollbackIcon';
import { StatsIcon } from '../icons/StatsIcon';
import { WorldIcon } from '../icons/WorldIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { Text } from '../Text';
import { motion } from 'framer-motion';
import { ReactElement } from 'react';

type CustomCardProps = {
  icon: ReactElement;
  title: string;
  description: string;
  delay: number;
};

const CustomCard = ({ icon, title, description, delay }: CustomCardProps) => (
  <motion.div
    className="relative"
    initial={{ opacity: 0, top: 20 }}
    whileInView={{ opacity: 1, top: 0 }}
    transition={{ delay }}
    viewport={{ once: true }}
  >
    <Card lineAnimation className="flex flex-col gap-4 md:p-12 p-6 rounded-2xl">
      {icon}
      <Text size="h3">{title}</Text>
      <Text className="justify-self-end">{description}</Text>
    </Card>
  </motion.div>
);

export const CardsSection = () => {
  return (
    <section className="flex flex-col items-center gap-16">
      <Text size="h2">Packed with features</Text>
      <div className="grid md:gap-6 gap-4 grid-cols-1 grid-rows-6 sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
        <CustomCard
          icon={
            <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#8dc2fb] to-[#446EFF]">
              <div className="rounded-full bg-gradient-to-b from-blue-1 to-[#446EFF] flex items-center justify-center h-full">
                <WorldIcon />
              </div>
            </div>
          }
          title="Trigger via HTTP or Cron"
          description="All Functions have a unique URL and can be assigned to custom domains, or configured to execute automatically based on a Cron expression."
          delay={0.2}
        />
        <CustomCard
          icon={
            <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
              <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
                <RollbackIcon />
              </div>
            </div>
          }
          title="Rollback in seconds"
          description="You can promote any previous Preview deployment to Production with a single click. The rollback is propagated globally in a few seconds."
          delay={0.4}
        />
        <CustomCard
          icon={
            <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
              <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
                <StatsIcon />
              </div>
            </div>
          }
          title="Analytics and logs"
          description="View detailed analytics with requests, CPU/memory, and HTTP traffic graphs. Debug your Functions with real-time logs."
          delay={0.6}
        />
        <CustomCard
          icon={
            <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
              <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
                <APIsIcon />
              </div>
            </div>
          }
          title="Build on Web APIs"
          description="No need to learn new things - we use the same Web APIs you already know like Request and Response, so you can build faster with no vendor lock-in."
          delay={0.8}
        />
        <CustomCard
          icon={
            <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
              <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
                <DollarIcon />
              </div>
            </div>
          }
          title="Pay for what you use"
          description="Get a generous free tier, and then only pay for the number of requests your Functions receive. No need to worry about scaling."
          delay={1}
        />
        <CustomCard
          icon={
            <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#8dc2fb] to-[#446EFF]">
              <div className="rounded-full bg-gradient-to-b from-blue-1 to-[#446EFF] flex items-center justify-center h-full">
                <HeartIcon />
              </div>
            </div>
          }
          title="We love Open Source"
          description=" Lagon is fully open-source and built in the open, focusing on the community. Use our Cloud platform, or self-host it yourself."
          delay={1.2}
        />
      </div>
    </section>
  );
};
