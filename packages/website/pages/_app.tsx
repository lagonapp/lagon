import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import AuthGuard from 'lib/components/AuthGuard';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';

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

export default App;
