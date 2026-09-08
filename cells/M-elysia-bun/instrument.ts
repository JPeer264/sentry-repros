import * as Sentry from '@sentry/elysia';

const SINK_PORT = process.env.SINK_PORT ?? '41999';

Sentry.init({
  dsn: 'https://abc123@o1.ingest.sentry.io/1',
  tunnel: `http://127.0.0.1:${SINK_PORT}/`,
  tracesSampleRate: 1.0,
  ...(process.env.LIFECYCLE === 'static' ? { traceLifecycle: 'static' as const } : {}),
});
