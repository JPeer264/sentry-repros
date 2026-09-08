import * as Sentry from '@sentry/cloudflare';
import handler from '@astrojs/cloudflare/entrypoints/server';

export default Sentry.withSentry(
  (env: any) => ({
    dsn: env.SENTRY_DSN,
    tunnel: env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: env.TRACE_LIFECYCLE === 'static' ? 'static' : 'stream',
    sendDefaultPii: true,
  }),
  handler,
);
