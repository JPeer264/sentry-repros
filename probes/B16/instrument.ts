import * as Sentry from '@sentry/bun';

const SINK_PORT = process.env.SINK_PORT ?? '34117';

Sentry.init({
  dsn: 'http://publickey@127.0.0.1:1/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  debug: !!process.env.SENTRY_DEBUG,
});
