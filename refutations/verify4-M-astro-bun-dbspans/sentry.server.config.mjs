import * as Sentry from '@sentry/astro';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: 'https://public@example.invalid/1',
    tunnel: process.env.SENTRY_TUNNEL || 'http://127.0.0.1:44311/',
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
    debug: process.env.SENTRY_DEBUG === '1',
  });
}
