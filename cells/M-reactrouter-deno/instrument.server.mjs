import * as Sentry from '@sentry/react-router';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  environment: 'production',
  debug: process.env.SENTRY_DEBUG === '1',
});
console.log('[probe] sentry initialized:', Sentry.isInitialized(), 'lifecycle:', process.env.TRACE_LIFECYCLE || 'static');
