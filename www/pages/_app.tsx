import { AppProps } from 'next/app';
import posthog from 'posthog-js';
import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css';
import { Layout } from '../lib/layouts/Layout';

// Only init PostHog on client-side and production env
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  posthog.init('phc_PfiPF8GAEzXURYWu9VaNI4lm6wNHReHMQ93OQ1iHuZx', { api_host: 'https://app.posthog.com' });
}

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Layout title="Lagon">
        <Component {...pageProps} />
      </Layout>
      <Analytics />
    </>
  );
};

export default App;
