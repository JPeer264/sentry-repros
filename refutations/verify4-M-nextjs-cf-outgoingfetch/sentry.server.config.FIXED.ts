// Variant used for build2 (static) / build3 (stream): http.client span + sentry-trace/baggage.
import * as Sentry from '@sentry/nextjs';
import { fetchIntegration } from '@sentry/cloudflare';
Sentry.init({
  dsn: 'https://public@127.0.0.1/1',
  tunnel: 'http://127.0.0.1:47311/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'stream',
  integrations: [fetchIntegration()],
});
