import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import AuthGuard from 'lib/components/AuthGuard';
import 'styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Layout from 'lib/Layout';
import { I18nProvider } from 'locales';
import en from 'locales/en';
import { trpc } from 'lib/trpc';

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

export default trpc.withTRPC(App);
