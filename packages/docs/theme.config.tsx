/* eslint-disable react-hooks/rules-of-hooks */
import { DocsThemeConfig, useTheme } from 'nextra-theme-docs';

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
  logo: () => {
    const { resolvedTheme } = useTheme();

    if (resolvedTheme === 'light' || !resolvedTheme) {
      return <img src="/logo-black.png" alt="Logo" className="h-6" />;
    }

    return <img src="/logo-white.png" alt="Logo" className="h-6" />;
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Deploy Serverless Functions at the Edge. Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users."
      />
      <meta property="og:url" content="https://lagon.app" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Lagon" />
      <meta
        name="twitter:card"
        content="Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users."
      />
      <meta
        property="og:description"
        content="Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users."
      />
      <meta property="og:image" content="https://i.imgur.com/lqVcA5Y.png" />
    </>
  ),
  chat: {
    link: 'https://discord.lagon.app/',
  },
};

export default config;
