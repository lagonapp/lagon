const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  transpilePackages: ['@lagon/ui'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  sentry: {
    tunnelRoute: '/monitoring-tunnel',
  },
  output: process.env.NEXTJS_OUTPUT,
};

const sentryWebpackPluginOptions = {
  silent: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
