import * as Sentry from '@sentry/react-router';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: 'http://127.0.0.1:53411/',
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE === 'stream' ? 'stream' : 'static',
  debug: process.env.SENTRY_DEBUG === '1',
});
