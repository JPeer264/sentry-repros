import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: process.env.SINK_URL ?? 'http://127.0.0.1:52911/',
  tracesSampleRate: 1,
  release: 'n10-bun',
});
