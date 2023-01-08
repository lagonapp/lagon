/* eslint-disable react-hooks/rules-of-hooks */
import Image from 'next/image';
import { DocsThemeConfig, useTheme } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  project: {
    link: 'https://github.com/lagonapp/lagon',
  },
  docsRepositoryBase: 'https://github.com/lagonapp/lagon/blob/main/packages/docs',
  banner: {
    key: 'dev',
    text: '🚧 This documentation is not complete yet as Lagon is in development.',
  },
  useNextSeoProps: () => ({ titleTemplate: '%s – Lagon' }),
  darkMode: true,
  footer: {
    text: `${new Date().getFullYear()} © Lagon.`,
  },
  logo: () => {
    const { resolvedTheme } = useTheme();

    if (resolvedTheme === 'light' || !resolvedTheme) {
      return <Image src="/logo-black.png" alt="Logo" height="24" width="80" />;
    }

    return <Image src="/logo-white.png" alt="Logo" height="24" width="80" />;
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Lagon is an open-source runtime and platform that allows developers to run TypeScript and JavaScript Functions at the Edge"
      />
      <meta property="og:url" content="https://lagon.app" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Lagon" />
      <meta
        name="twitter:card"
        content="Lagon is an open-source runtime and platform that allows developers to run TypeScript and JavaScript Functions at the Edge"
      />
      <meta
        property="og:description"
        content="Lagon is an open-source runtime and platform that allows developers to run TypeScript and JavaScript Functions at the Edge"
      />
      <meta property="og:image" content="https://i.imgur.com/lqVcA5Y.png" />
    </>
  ),
  chat: {
    link: 'https://discord.lagon.app/',
  },
};

export default config;
