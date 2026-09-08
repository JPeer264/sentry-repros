import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: 'http://127.0.0.1:41120/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'stream',
  debug: true,
});
