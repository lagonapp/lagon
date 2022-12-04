import { AppProps } from 'next/app';
import posthog from 'posthog-js';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from '../lib/layouts/Layout';
import * as Tooltip from '@radix-ui/react-tooltip';
import '../styles/globals.css';

// Only init PostHog on client-side and production env
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  posthog.init('phc_PfiPF8GAEzXURYWu9VaNI4lm6wNHReHMQ93OQ1iHuZx', { api_host: 'https://app.posthog.com' });
}

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <Tooltip.Provider skipDelayDuration={0} delayDuration={0}>
      <Layout title="Lagon">
        <Component {...pageProps} />
      </Layout>
      <Analytics />
    </Tooltip.Provider>
  );
};

export default App;
