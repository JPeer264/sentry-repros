import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: process.env.SINK_URL,
  tracesSampleRate: 1.0,
  environment: 'probe',
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  debug: process.env.SENTRY_DEBUG === '1',
});
