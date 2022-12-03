import { useEffect, useState } from 'react';
import { AnimatedLine } from '../AnimatedLine';
import { Badge } from '../Badge';
import { Star } from '../Star';
import { Text } from '../Text';

const CATEGORIES = ['websites', 'apps', 'cron jobs', 'webhooks'];

export const FeaturesSection = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(index => {
        if (index === CATEGORIES.length - 1) {
          return 0;
        }

        return index + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
          {CATEGORIES[index]}
        </span>
      </Text>
      <div className="flex flex-col gap-2 items-center">
        <div className="flex gap-2">
          <Badge>Open source</Badge>
          <Badge>Custom JS Runtime</Badge>
        </div>
        <div className="flex gap-2">
          <Badge>Deploy with CLI, Playground, GitHub Action</Badge>
          <Badge>HTTP/2</Badge>
        </div>
        <div className="flex gap-2">
          <Badge>gzip / Brottli</Badge>
          <Badge>Advanced statistics</Badge>
          <Badge>Realtime logs</Badge>
          <Badge>Cron triggers</Badge>
        </div>
        <div className="flex gap-2">
          <Badge>Preview and Production deployments</Badge>
          <Badge>Custom domains</Badge>
          <Badge>Cloud or self-hosted</Badge>
          <Badge>Automatic HTTPS</Badge>
        </div>
      </div>
    </section>
  );
};
