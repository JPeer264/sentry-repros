import * as Sentry from '@sentry/cloudflare';
import nitroHandler from './.output/server/index.mjs';

export default Sentry.withSentry(
  env => ({
    dsn: 'https://public@127.0.0.1/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.TRACE_LIFECYCLE || 'static',
    debug: true,
  }),
  nitroHandler,
);
