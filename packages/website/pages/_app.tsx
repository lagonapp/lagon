import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import AuthGuard from 'lib/components/AuthGuard';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { withTRPC } from '@trpc/next';
import { AppRouter } from './api/trpc/[trpc]';
import Layout from 'lib/Layout';
import { I18nProvider } from 'locales';
import en from 'locales/en';

type LayoutAppProps = AppProps & {
  Component: AppProps['Component'] & {
    title: string;
  };
};

const App = ({ Component, pageProps: { session, ...pageProps } }: LayoutAppProps) => {
  return (
    <SessionProvider session={session}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-white text-stone-800 dark:bg-black dark:text-stone-200',
        }}
      />
      <AuthGuard>
        <I18nProvider locale={pageProps.locale} fallbackLocale={en}>
          <Layout title={Component.title}>
            <Component {...pageProps} />
          </Layout>
        </I18nProvider>
      </AuthGuard>
    </SessionProvider>
  );
};

export default withTRPC<AppRouter>({
  config: () => {
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
