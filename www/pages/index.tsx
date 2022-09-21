import Head from 'next/head';
import Header from '../lib/components/Header';
import Globe from '../lib/components/Globe';
import useSystemTheme from '../lib/hooks/useSystemTheme';
import { DiscordIcon } from '../lib/components/Icons';

const Home = () => {
  const theme = useSystemTheme();

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
      <Header />
      <div className="flex flex-col gap-8 items-center text-center mt-[8vh] md:mt-[26vh] max-w-2xl mx-auto px-6">
        <h1
          className="text-white text-5xl font-bold leading-[46px] animate-fade z-10"
          style={{ fontFamily: 'Poppins' }}
        >
          Deploy Serverless Functions at the&nbsp;
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-purple-500">Edge</span>
        </h1>
        <h2 className="text-gray-300 text-sm max-w-sm leading-relaxed animate-fade z-10">
          Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users.
        </h2>
        <div className="z-10 flex flex-col items-center gap-4">
          <a
            href="https://tally.so/r/n9q1Rp"
            target="_blank"
            className="text-base text-purple-100 px-8 py-2 rounded-full bg-gradient-to-br from-purple-500/70 to-purple-500/0 border border-purple-500 transition duration-300 hover:shadow-purple-500/40 hover:shadow-xl hover:border-purple-400 animate-fade-slow select-none"
            rel="noreferrer"
          >
            Get email updates
          </a>
          <a
            href="https://discord.lagon.app"
            target="_blank"
            className="text-sm text-gray-300 hover:text-white flex gap-1 items-center select-none z-10"
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
