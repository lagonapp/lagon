import Head from 'next/head';
import useSystemTheme from 'react-use-system-theme';
import Header from '../lib/components/Header';
import Globe from '../lib/components/Globe';

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
      <div className="flex flex-col gap-8 items-center text-center mt-[26vh] max-w-xl mx-auto px-6">
        <h1 className="text-white text-5xl font-bold leading-[46px] animate-fade" style={{ fontFamily: 'Poppins' }}>
          Deploy Serverless Functions at the&nbsp;
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-purple-500">Edge</span>
        </h1>
        <h2 className="text-gray-300 text-sm max-w-sm leading-relaxed animate-fade">
          Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users.
        </h2>
        <a
          href="https://tally.so/r/n9q1Rp"
          target="_blank"
          className="text-base text-purple-100 px-8 py-2 rounded-full bg-gradient-to-br from-purple-500/70 to-purple-500/0 border border-purple-500 z-10 transition duration-300 hover:shadow-purple-500/40 hover:shadow-xl hover:border-purple-400 animate-fade-slow"
          rel="noreferrer"
        >
          Get email updates
        </a>
      </div>
      <Globe />
    </>
  );
};

export default Home;
