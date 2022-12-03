import { Inter } from '@next/font/google';
import { Header } from '../lib/components/Header';
import useSystemTheme from '../lib/hooks/useSystemTheme';
import { useEffect, useRef } from 'react';
import { Footer } from '../lib/components/Footer';
import Head from 'next/head';
import { HomeSection } from '../lib/components/sections/HomeSection';
import { ExplainSection } from '../lib/components/sections/ExplainSection';
import { CardsSection } from '../lib/components/sections/CardsSection';
import { FeaturesSection } from '../lib/components/sections/FeaturesSection';

const inter = Inter({
  subsets: ['latin'],
});

const Home = () => {
  const theme = useSystemTheme();
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
      <Head>
        <title>Lagon</title>
        {theme === 'dark' ? (
          <link rel="icon" href="/favicon-white.ico" />
        ) : (
          <link rel="icon" href="/favicon-black.ico" />
        )}
      </Head>
      <div className={`bg-dark pt-8 ${inter.className}`}>
        <div
          className="w-full h-64 top-0 left-0 pointer-events-none absolute"
          style={{
            background:
              'linear-gradient(to bottom, transparent, #050211), repeating-linear-gradient(-45deg, #041F47, #041F47 1px, transparent 1px, transparent 20px)',
          }}
        />
        <div
          className="w-80 h-80 absolute rounded-full transform translate-x-[-50%] translate-y-[-50%] pointer-events-none bg-gradient-to-br from-purple/10 to-blue-1/10 blur-3xl"
          ref={ball}
        />
        <Header />
        <main className="container mx-auto flex flex-col gap-64 pt-44">
          <HomeSection />
          <ExplainSection />
          <FeaturesSection />
          <CardsSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Home;
