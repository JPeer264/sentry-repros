import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'http://public@127.0.0.1:1/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT || 9999}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: (process.env.LIFECYCLE as 'static' | 'stream') || 'stream',
});
