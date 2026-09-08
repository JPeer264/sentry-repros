import * as Sentry from '@sentry/astro';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'http://public@127.0.0.1:41501/1',
    tunnel: 'http://127.0.0.1:41501/',
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.LIFECYCLE === 'stream' ? 'stream' : 'static',
    sendDefaultPii: true,
    release: 'astro-bun-probe@1',
  });
}
