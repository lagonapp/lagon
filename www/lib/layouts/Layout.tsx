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
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const theme = useSystemTheme();

  return (
    <>
      <Head>
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
        <main className="container mx-auto px-4 flex flex-col md:gap-64 gap-32 md:pt-44 pt-24">{children}</main>
        <Footer />
      </div>
    </>
  );
};
