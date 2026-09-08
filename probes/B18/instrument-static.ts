import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT ?? 9999}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  environment: 'probe-b18',
});
