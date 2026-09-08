import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: process.env.SINK,
  tracesSampleRate: 1.0,
  debug: !!process.env.SENTRY_DEBUG,
});
