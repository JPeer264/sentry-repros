import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://abc1234567890abcdef1234567890ab@o0.ingest.sentry.io/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
