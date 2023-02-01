import { useEffect, useRef } from 'react';
import { HomeSection } from '../lib/components/sections/HomeSection';
import { ExplainSection } from '../lib/components/sections/ExplainSection';
import { CardsSection } from '../lib/components/sections/CardsSection';
import { FeaturesSection } from '../lib/components/sections/FeaturesSection';
import { EdgeNetworkSection } from '../lib/components/sections/EdgeNetworkSection';
import Head from 'next/head';

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
        <title>Deploy JavaScript Functions at the Edge - Lagon</title>
      </Head>
      <Header />
      <div className="mx-auto mt-[8vh] flex max-w-2xl flex-col items-center gap-8 px-6 text-center md:mt-[26vh]">
        <h1 className={`animate-fade z-10 text-5xl leading-[46px] text-white ${poppins.className}`}>
          Deploy Serverless Functions at the&nbsp;
          <span className="bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent">Edge</span>
        </h1>
        <h2 className="animate-fade z-10 max-w-sm text-sm leading-relaxed text-gray-300">
          Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users.
        </h2>
        <div className="z-10 flex flex-col items-center gap-4">
          <a
            href="https://tally.so/r/n9q1Rp"
            target="_blank"
            className="animate-fade-slow select-none rounded-full border border-purple-500 bg-gradient-to-br from-purple-500/70 to-purple-500/0 px-8 py-2 text-base text-purple-100 transition duration-300 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/40"
            rel="noreferrer"
          >
            Get email updates
          </a>
          <a
            href="https://discord.lagon.app"
            target="_blank"
            className="z-10 flex select-none items-center gap-1 text-sm text-gray-300 hover:text-white"
            rel="noreferrer"
          >
            <DiscordIcon />
            Join the Discord
          </a>
        </div>
      </div>
      <Globe />
    </>
  );
};

export default Home;
