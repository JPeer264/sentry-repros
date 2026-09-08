import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: process.env.SINK_URL,
  environment: 'probe',
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  debug: process.env.SENTRY_DEBUG === '1',
});

console.log('[probe] Sentry.isInitialized()', Sentry.isInitialized());
