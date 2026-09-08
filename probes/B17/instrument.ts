import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as 'stream' | 'static') ?? 'stream',
  debug: process.env.SENTRY_DEBUG === '1',
});
