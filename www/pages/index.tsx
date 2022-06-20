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
      <p>Lagon allows you to write JavaScript Serverless Functions and deploy them at the Edge, with no cold start.</p>
    </>
  );
};

export default Home;
