import * as Sentry from '@sentry/remix';
import { bunHttpServerIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: process.env.SINK_URL,
  environment: 'probe',
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE || 'static',
  debug: process.env.SENTRY_DEBUG === '1',
  integrations: [bunHttpServerIntegration({ spans: false })],
});
console.log('[probe] isInitialized', Sentry.isInitialized(), 'bun', !!process.versions.bun);
