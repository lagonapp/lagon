'use client';

import { useEffect, useRef } from 'react';
import { HomeSection } from '../lib/components/sections/HomeSection';
import { ExplainSection } from '../lib/components/sections/ExplainSection';
import { CardsSection } from '../lib/components/sections/CardsSection';
import { FeaturesSection } from '../lib/components/sections/FeaturesSection';
import { EdgeNetworkSection } from '../lib/components/sections/EdgeNetworkSection';

export default function Home() {
  const ball = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (ball.current) {
        ball.current.style.left = `${event.pageX}px`;
        ball.current.style.top = `${event.pageY}px`;
      }
    };

    window.addEventListener('mousemove', listener);

    return () => {
      window.removeEventListener('mousemove', listener);
    };
  }, [ball]);

  return (
    <>
      <title>Deploy Serverless Functions at the Edge - Lagon</title>
      <div
        className="from-purple/10 to-blue-1/10 pointer-events-none absolute hidden h-80 w-80 translate-x-[-50%] translate-y-[-50%] transform rounded-full bg-gradient-to-br blur-3xl md:block"
        ref={ball}
      />
      <HomeSection />
      <ExplainSection />
      <FeaturesSection />
      <CardsSection />
      <EdgeNetworkSection />
    </>
  );
}
