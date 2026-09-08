import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://abcdef0123456789abcdef0123456789@o0.ingest.sentry.io/0',
  tunnel: process.env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
});
