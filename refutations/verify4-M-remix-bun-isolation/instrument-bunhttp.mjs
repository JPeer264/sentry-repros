import { bunHttpServerIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/remix';

Sentry.init({
  dsn: 'https://public@localhost/1',
  tunnel: process.env.SINK_URL,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  environment: 'probe',
  integrations: [bunHttpServerIntegration({ spans: process.env.BUNHTTP_SPANS !== '0' })],
  debug: process.env.SENTRY_DEBUG === '1',
});

console.log('[probe] init ok =', Sentry.isInitialized(), 'bunHttpServer spans =', process.env.BUNHTTP_SPANS !== '0');
