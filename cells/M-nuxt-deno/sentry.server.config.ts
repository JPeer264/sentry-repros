import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: 'https://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT ?? 41711}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.SENTRY_LIFECYCLE === 'stream' ? 'stream' : 'static',
  debug: true,
});
