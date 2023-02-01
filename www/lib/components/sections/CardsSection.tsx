import { Card } from '../Card';
import { APIsIcon } from '../icons/APIsIcon';
import { DollarIcon } from '../icons/DollarIcon';
import { RollbackIcon } from '../icons/RollbackIcon';
import { StatsIcon } from '../icons/StatsIcon';
import { WorldIcon } from '../icons/WorldIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { Text } from '../Text';
import { motion } from 'framer-motion';
import { ReactElement, ReactNode } from 'react';
import Link from 'next/link';

type CustomCardProps = {
  icon: ReactElement;
  title: string;
  description: ReactNode;
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
    <Card lineAnimation className="flex flex-col gap-4 rounded-2xl p-6 md:p-12">
      {icon}
      <Text size="h3">{title}</Text>
      <Text className="justify-self-end">{description}</Text>
    </Card>
  </motion.div>
);

export const CardsSection = () => {
  return (
    <section className="flex flex-col items-center gap-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Text size="h2">Packed with features</Text>
      </motion.div>
      <div className="grid grid-cols-1 grid-rows-6 gap-4 sm:grid-cols-2 sm:grid-rows-3 md:gap-6 lg:grid-cols-3 lg:grid-rows-2">
        <CustomCard
          icon={
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#8dc2fb] to-[#446EFF] p-[1px]">
              <div className="from-blue-1 flex h-full items-center justify-center rounded-full bg-gradient-to-b to-[#446EFF]">
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
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#86fbd5] to-[#14BDB3] p-[1px]">
              <div className="from-green flex h-full items-center justify-center rounded-full bg-gradient-to-b to-[#14BDB3]">
                <RollbackIcon />
              </div>
            </div>
          }
          title="Rollback in seconds"
          description="You can promote any previous Preview Deployment to Production with a single click. The rollback is propagated globally in a few seconds."
          delay={0.4}
        />
        <CustomCard
          icon={
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#c797fa] to-[#6C04AC] p-[1px]">
              <div className="from-purple flex h-full items-center justify-center rounded-full bg-gradient-to-b to-[#6C04AC]">
                <StatsIcon />
              </div>
            </div>
          }
          title="Analytics and logs"
          description="Analyse the performance and usage of your Functions with detailed metrics, and debug them thanks to real-time logging."
          delay={0.6}
        />
        <CustomCard
          icon={
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#86fbd5] to-[#14BDB3] p-[1px]">
              <div className="from-green flex h-full items-center justify-center rounded-full bg-gradient-to-b to-[#14BDB3]">
                <APIsIcon />
              </div>
            </div>
          }
          title="Build on Web APIs"
          description={
            <>
              Use the same Web APIs you already know like&nbsp;
              <span className="font-mono">Request</span> and <span className="font-mono">fetch()</span>, NPM packages,
              frameworks and libraries. We follow the&nbsp;
              <Link href="https://wintercg.org" target="_blank" className="hover:underline">
                WinterCG
              </Link>
              &nbsp;conventions.
            </>
          }
          delay={0.2}
        />
        <CustomCard
          icon={
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#c797fa] to-[#6C04AC] p-[1px]">
              <div className="from-purple flex h-full items-center justify-center rounded-full bg-gradient-to-b to-[#6C04AC]">
                <DollarIcon />
              </div>
            </div>
          }
          title="Pay as you go"
          description="Get a generous free tier, and then only pay for the number of requests your Functions receives, without worrying about scaling."
          delay={0.4}
        />
        <CustomCard
          icon={
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-[#8dc2fb] to-[#446EFF] p-[1px]">
              <div className="from-blue-1 flex h-full items-center justify-center rounded-full bg-gradient-to-b to-[#446EFF]">
                <HeartIcon />
              </div>
            </div>
          }
          title="We love Open Source"
          description="Lagon is fully open source and is focused on the community. You can choose to use Lagon Cloud, or self-host it on your own infrastructure."
          delay={0.6}
        />
      </div>
    </section>
  );
};
