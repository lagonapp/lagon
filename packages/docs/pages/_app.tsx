import '../styles/globals.css';
import 'nextra-theme-docs/style.css';
import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
};

export default App;
