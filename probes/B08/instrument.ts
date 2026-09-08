import * as Sentry from '@sentry/bun';

const port = process.env.SINK_PORT ?? '37261';

Sentry.init({
  dsn: 'https://public@o0.ingest.sentry.io/0',
  tunnel: `http://127.0.0.1:${port}/`,
  tracesSampleRate: 1.0,
  debug: !!process.env.SENTRY_DEBUG,
});
