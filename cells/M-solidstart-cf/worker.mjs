import * as Sentry from '@sentry/cloudflare';
import nitroHandler from './.output/server/index.mjs';

export default Sentry.withSentry(
  () => ({
    dsn: 'https://public@localhost/1',
    tunnel: 'http://127.0.0.1:53817/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    debug: true,
  }),
  nitroHandler,
);
