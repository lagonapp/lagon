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
    <section className="relative flex flex-col items-center gap-16">
      <div
        className="absolute -top-32 z-0 h-[400px] w-full"
        style={{ background: 'radial-gradient(closest-side, rgb(12, 17, 36), transparent)' }}
      >
        {[...Array(20)].map((_, i) => (
          <Star key={i} />
        ))}
        {[...Array(3)].map((_, i) => (
          <AnimatedLine size="large" key={i} />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
      >
        <Text size="h2" className="relative">
          Build faster&nbsp;
          <span className="inline-flex h-[60px] overflow-hidden">
            <ul style={{ animation: 'text-carousel calc(2s * 4) steps(4) infinite' }}>
              {CATEGORIES.map((category, i) => (
                <li
                  key={i}
                  className="from-green to-purple h-[60px] bg-gradient-to-r via-[#5A7ACB] bg-clip-text text-transparent"
                  style={{ animation: 'text-carousel-line 2s infinite' }}
                >
                  {category}
                </li>
              ))}
              <li
                className="from-green to-purple h-[60px] bg-gradient-to-r via-[#5A7ACB] bg-clip-text text-transparent"
                style={{ animation: 'text-carousel-line 2s infinite' }}
              >
                {CATEGORIES[0]}
              </li>
            </ul>
          </span>
        </Text>
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          <AnimatedBadge delay={0.2}>Open source</AnimatedBadge>
          <AnimatedBadge delay={0.35}>Custom JS Runtime</AnimatedBadge>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <AnimatedBadge delay={0.5}>Deploy with CLI, Playground, GitHub Action</AnimatedBadge>
          <AnimatedBadge delay={0.65}>HTTP/2</AnimatedBadge>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <AnimatedBadge delay={0.8}>gzip / Brottli</AnimatedBadge>
          <AnimatedBadge delay={0.95}>Advanced statistics</AnimatedBadge>
          <AnimatedBadge delay={1.1}>Realtime logs</AnimatedBadge>
          <AnimatedBadge delay={1.25}>Cron triggers</AnimatedBadge>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <AnimatedBadge delay={1.4}>Preview and Production deployments</AnimatedBadge>
          <AnimatedBadge delay={1.55}>Custom domains</AnimatedBadge>
          <AnimatedBadge delay={1.7}>Cloud or self-hosted</AnimatedBadge>
          <AnimatedBadge delay={1.85}>Automatic HTTPS</AnimatedBadge>
        </div>
      </div>
    </section>
  );
};
