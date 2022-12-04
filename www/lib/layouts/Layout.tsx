import { Inter } from '@next/font/google';
import { Header } from '../components/Header';
import useSystemTheme from '../hooks/useSystemTheme';
import { ReactNode } from 'react';
import { Footer } from '../components/Footer';
import Head from 'next/head';

const inter = Inter({
  subsets: ['latin'],
});

type LayoutProps = {
  title: string;
  children: ReactNode;
};

export const Layout = ({ title, children }: LayoutProps) => {
  const theme = useSystemTheme();

  return (
    <>
      <Head>
        <title>{title}</title>
        {theme === 'dark' ? (
          <link rel="icon" href="/favicon-white.ico" />
        ) : (
          <link rel="icon" href="/favicon-black.ico" />
        )}
      </Head>
      <div className={`bg-dark pt-8 ${inter.className}`}>
        <div
          className="w-full h-64 top-0 left-0 pointer-events-none absolute"
          style={{
            background:
              'linear-gradient(to bottom, transparent, #050211), repeating-linear-gradient(-45deg, #041F47, #041F47 1px, transparent 1px, transparent 20px)',
          }}
        />
        <Header />
        <main className="container mx-auto flex flex-col gap-64 pt-44">{children}</main>
        <Footer />
      </div>
    </>
  );
};
