import { PostHogProvider } from '../lib/posthog';
import type { AppProps } from 'next/app';
import 'nextra-theme-docs/style.css';
import '../styles/globals.css';

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <PostHogProvider>
      <Component {...pageProps} />
    </PostHogProvider>
  );
};

export default App;
