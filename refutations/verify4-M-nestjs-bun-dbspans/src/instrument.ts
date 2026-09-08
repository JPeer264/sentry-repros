import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: process.env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as 'static' | 'stream') || 'static',
  debug: !!process.env.SENTRY_DEBUG,
});
