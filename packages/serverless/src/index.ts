import cluster from 'node:cluster';
import dotenv from 'dotenv';
import worker from 'src/worker';
import master from 'src/master';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: `serverless@${process.env.npm_package_version}`,
});

dotenv.config();

if (cluster.isPrimary) {
  master();
} else {
  worker();
}
