import Head from 'next/head';
import useSystemTheme from 'react-use-system-theme';

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
      <div className="flex flex-col gap-8 items-center justify-center w-screen h-screen text-center">
        <h1 className="text-white text-5xl font-bold leading-[42px]" style={{ fontFamily: 'Poppins' }}>
          Deploy Serverless <br /> Functions at the{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-purple-500">Edge</span>
        </h1>
        <h2 className="text-gray-300 text-sm">
          Lagon is an open source platform that allows you to run <br /> TypeScript and JavaScript close to your users.
        </h2>
      </div>
      <button
        type="button"
        className="absolute bottom-[20vh] left-[50vw] transform -translate-x-[50%] z-10 text- text-purple-100 px-8 py-2 rounded-full bg-gradient-to-br from-purple-500/70 to-purple-500/0 border border-purple-500"
      >
        Deploy now
      </button>
      <img src="/world.svg" alt="Image of the world" className="absolute -bottom-[20vh] w-[130vw]" />
    </>
  );
};

export default Home;
