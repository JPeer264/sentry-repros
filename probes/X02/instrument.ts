import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'http://publickey@127.0.0.1:9999/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});
