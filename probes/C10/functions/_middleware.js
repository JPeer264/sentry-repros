import * as Sentry from '@sentry/cloudflare';

export const onRequest = Sentry.sentryPagesPlugin(context => ({
  dsn: 'https://c10c10c10c10c10c10c10c10c10c10c1@o1.ingest.sentry.io/1010',
  tunnel: `http://127.0.0.1:${context.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  debug: true,
}));
