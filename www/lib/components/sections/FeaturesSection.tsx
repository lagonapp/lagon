import { AnimatedLine } from '../AnimatedLine';
import { Badge } from '../Badge';
import { Star } from '../Star';
import { Text } from '../Text';
import { motion } from 'framer-motion';

const CATEGORIES = ['websites', 'apps', 'cron jobs', 'webhooks'];

type AnimatedBadgeProps = {
  delay: number;
  children: string;
};

const AnimatedBadge = ({ delay, children }: AnimatedBadgeProps) => (
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay }} viewport={{ once: true }}>
    <Badge>{children}</Badge>
  </motion.div>
);

export const FeaturesSection = () => {
  return (
    <section className="flex flex-col items-center gap-16 relative">
      <div
        className="absolute -top-32 h-[400px] w-full z-0"
        style={{ background: 'radial-gradient(closest-side, rgb(12, 17, 36), transparent)' }}
      >
        {[...Array(20)].map((_, i) => (
          <Star key={i} />
        ))}
        {[...Array(3)].map((_, i) => (
          <AnimatedLine size="large" key={i} />
        ))}
      </div>
      <Text size="h2" className="z-10">
        Build faster&nbsp;
        <span className="h-[60px] overflow-hidden inline-flex">
          <ul style={{ animation: 'text-carousel calc(2s * 4) steps(4) infinite' }}>
            {CATEGORIES.map((category, i) => (
              <li
                key={i}
                className="h-[60px] text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple"
                style={{ animation: 'text-carousel-line 2s infinite' }}
              >
                {category}
              </li>
            ))}
            <li
              className="h-[60px] text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple"
              style={{ animation: 'text-carousel-line 2s infinite' }}
            >
              {CATEGORIES[0]}
            </li>
          </ul>
        </span>
      </Text>
      <div className="flex flex-col gap-2 items-center">
        <div className="flex gap-2 flex-wrap justify-center">
          <AnimatedBadge delay={0.2}>Open source</AnimatedBadge>
          <AnimatedBadge delay={0.35}>Custom JS Runtime</AnimatedBadge>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <AnimatedBadge delay={0.5}>Deploy with CLI, Playground, GitHub Action</AnimatedBadge>
          <AnimatedBadge delay={0.65}>HTTP/2</AnimatedBadge>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <AnimatedBadge delay={0.8}>gzip / Brottli</AnimatedBadge>
          <AnimatedBadge delay={0.95}>Advanced statistics</AnimatedBadge>
          <AnimatedBadge delay={1.1}>Realtime logs</AnimatedBadge>
          <AnimatedBadge delay={1.25}>Cron triggers</AnimatedBadge>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          <AnimatedBadge delay={1.4}>Preview and Production deployments</AnimatedBadge>
          <AnimatedBadge delay={1.55}>Custom domains</AnimatedBadge>
          <AnimatedBadge delay={1.7}>Cloud or self-hosted</AnimatedBadge>
          <AnimatedBadge delay={1.85}>Automatic HTTPS</AnimatedBadge>
        </div>
      </div>
    </section>
  );
};
