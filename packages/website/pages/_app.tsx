import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import AuthGuard from 'lib/components/AuthGuard';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { withTRPC } from '@trpc/next';
import { AppRouter } from './api/trpc/[trpc]';

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <SessionProvider session={session}>
      <Toaster position="top-right" />
      <AuthGuard>
        <Component {...pageProps} />
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
