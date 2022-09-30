import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  project: {
    link: 'https://github.com/lagonapp/lagon',
  },
  docsRepositoryBase: 'https://github.com/lagonapp/lagon/blob/main/packages/docs',
  banner: {
    key: 'dev',
    text: 'Warning! This documentation is heavily in Work-in-Progress and subject to changes.',
  },
  titleSuffix: ' – Lagon',
  darkMode: true,
  footer: {
    text: `${new Date().getFullYear()} © Lagon.`,
  },
  logo: <img src="/logo-black.png" alt="Logo" className="h-6" />,
  head: (
    <>
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="description" content="Lagon - Deploy Serverless Functions at the Edge" />
      <meta name="og:description" content="Lagon - Deploy Serverless Functions at the Edge" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="https://docs.lagon.app/og.png" />
      <meta name="twitter:site:domain" content="nextra.vercel.app" />
      <meta name="twitter:url" content="https://docs.lagon.app" />
      <meta name="og:title" content="Lagon - Deploy Serverless Functions at the Edge" />
      <meta name="og:image" content="https://docs.lagon.app/og.png" />
      <meta name="apple-mobile-web-app-title" content="Lagon" />
    </>
  ),
  chat: {
    link: 'https://discord.lagon.app/',
  },
};

export default config;
