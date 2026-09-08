import * as Sentry from '@sentry/cloudflare';
import handler from '@astrojs/cloudflare/entrypoints/server';

export default Sentry.withSentry(
  (env: { SENTRY_DSN: string; SINK_URL: string }) => ({
    dsn: env.SENTRY_DSN,
    tunnel: env.SINK_URL,
    tracesSampleRate: 1.0,
    traceLifecycle: 'static' as const,
    sendDefaultPii: true,
  }),
  handler,
);
