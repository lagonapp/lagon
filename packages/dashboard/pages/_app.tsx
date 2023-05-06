import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import AuthGuard from 'lib/components/AuthGuard';
import '@lagon/ui/src/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import Layout from 'lib/Layout';
import { I18nProvider, usePersistLocale } from 'locales';
import en from 'locales/en';
import { trpc } from 'lib/trpc';
import { useMemo } from 'react';
import { PostHogProvider } from 'lib/posthog';

type LayoutAppProps = AppProps & {
  Component: AppProps['Component'] & {
    title: string;
    anonymous?: boolean;
  };
};

const App = ({ Component, pageProps: { session, ...pageProps } }: LayoutAppProps) => {
  usePersistLocale();

  const MaybeAuthGuard = useMemo(
    () => (Component.anonymous ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AuthGuard),
    [Component.anonymous],
  );

  return (
    <PostHogProvider>
      <SessionProvider session={session}>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-white text-stone-800 dark:bg-black dark:text-stone-200',
          }}
        />
        <MaybeAuthGuard>
          <I18nProvider locale={pageProps.locale} fallbackLocale={en}>
            <Layout title={Component.title} anonymous={Component.anonymous}>
              <Component {...pageProps} />
            </Layout>
          </I18nProvider>
        </MaybeAuthGuard>
      </SessionProvider>
    </PostHogProvider>
  );
};

export default trpc.withTRPC(App);
