import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import AuthGuard from 'lib/components/AuthGuard';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { withTRPC } from '@trpc/next';
import { AppRouter } from './api/trpc/[trpc]';

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <SessionProvider session={session}>
      <AuthGuard>
        <SWRConfig
          value={{
            fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
            suspense: true,
          }}
        >
          <Toaster position="top-right" />
          <Component {...pageProps} />
        </SWRConfig>
      </AuthGuard>
    </SessionProvider>
  );
};

export default withTRPC<AppRouter>({
  config: ({ ctx }) => {
    return {
      url: '/api/trpc',
      queryClientConfig: {
        defaultOptions: {
          queries: {
            suspense: true,
          },
        },
      },
    };
  },
})(App);
