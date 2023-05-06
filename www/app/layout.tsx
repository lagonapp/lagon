import { ReactNode } from 'react';
import { DESCRIPTION, SHORT_DESCRIPTION } from '../lib/constants';
import tailwind from '../tailwind.config';
import { Inter } from 'next/font/google';
import { Header } from '../lib/components/Header';
import { Footer } from '../lib/components/Footer';
import { PostHogProvider } from '../lib/posthog';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata = {
  description: `${SHORT_DESCRIPTION}. ${DESCRIPTION}`,
  themeColor: tailwind.theme.extend.colors.dark,
  openGraph: {
    url: 'https://lagon.app',
    type: 'website',
    title: SHORT_DESCRIPTION,
    description: DESCRIPTION,
    images: {
      url: 'https://lagon.app/og.jpg',
    },
  },
  twitter: {
    card: 'summary_large_image',
    site: 'https://lagon.app',
    title: SHORT_DESCRIPTION,
    description: DESCRIPTION,
    images: {
      url: 'https://lagon.app/og.jpg',
    },
  },
};

type LayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <div className={`bg-dark pt-8 ${inter.className}`}>
            <div
              className="pointer-events-none absolute left-0 top-0 h-64 w-full"
              style={{
                background:
                  'linear-gradient(to bottom, transparent, #050211), repeating-linear-gradient(-45deg, #041F47, #041F47 1px, transparent 1px, transparent 20px)',
              }}
            />
            <Header />
            <main className="container mx-auto flex min-h-screen flex-col gap-32 px-4 pt-24 md:gap-64">{children}</main>
            <Footer />
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
