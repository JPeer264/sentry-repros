import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: 'http://127.0.0.1:51873/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'stream',
  debug: true,
});
