// Variant used for build1 / wrangler1.log: documented wiring, NO http.client span.
import * as Sentry from '@sentry/nextjs';
Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tunnel: 'http://127.0.0.1:47311/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
});
