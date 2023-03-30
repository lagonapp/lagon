import { Analytics } from '@vercel/analytics/react';
import { ReactNode } from 'react';
import { Layout } from '../lib/layouts/Layout';
import { DESCRIPTION, SHORT_DESCRIPTION } from '../lib/constants';
import { theme } from '../tailwind.config';
import '../styles/globals.css';
import '../lib/posthog';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
        <Analytics />
      </body>
    </html>
  );
}

export const metadata = {
  description: `${SHORT_DESCRIPTION}. ${DESCRIPTION}`,
  themeColor: theme.colors.dark,
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
