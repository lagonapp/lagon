import { useEffect, useRef } from 'react';
import { HomeSection } from '../lib/components/sections/HomeSection';
import { ExplainSection } from '../lib/components/sections/ExplainSection';
import { CardsSection } from '../lib/components/sections/CardsSection';
import { FeaturesSection } from '../lib/components/sections/FeaturesSection';
import { EdgeNetworkSection } from '../lib/components/sections/EdgeNetworkSection';
import Head from 'next/head';
import { SHORT_DESCRIPTION } from '../lib/constants';

const Home = () => {
  const ball = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (ball.current) {
        ball.current.style.left = `${event.clientX}px`;
        ball.current.style.top = `${event.clientY}px`;
      }
    };

    window.addEventListener('mousemove', listener);

    return () => {
      window.removeEventListener('mousemove', listener);
    };
  }, [ball]);

  return (
    <>
      <Head>
        <title>{SHORT_DESCRIPTION} - Lagon</title>
      </Head>
      <div
        className="hidden md:block w-80 h-80 absolute rounded-full transform translate-x-[-50%] translate-y-[-50%] pointer-events-none bg-gradient-to-br from-purple/10 to-blue-1/10 blur-3xl"
        ref={ball}
      />
      <HomeSection />
      <ExplainSection />
      <FeaturesSection />
      <CardsSection />
      <EdgeNetworkSection />
    </>
  );
};

export default Home;
