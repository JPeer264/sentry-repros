import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@o1.ingest.sentry.io/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT || 47311}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE === 'static' ? 'static' : 'stream',
});
