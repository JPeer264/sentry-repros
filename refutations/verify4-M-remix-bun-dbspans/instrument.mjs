import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: process.env.SINK_URL,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  environment: 'probe',
  debug: process.env.SENTRY_DEBUG === '1',
});
console.log('[probe] sentry initialized:', Sentry.isInitialized());
