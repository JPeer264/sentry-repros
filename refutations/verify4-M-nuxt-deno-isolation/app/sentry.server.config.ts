import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: 'https://1234567890abcdef1234567890abcdef@o1.ingest.sentry.io/1',
  tunnel: process.env.SENTRY_TUNNEL || 'http://127.0.0.1:41377/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  debug: true,
});
