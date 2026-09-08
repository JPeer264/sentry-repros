import * as Sentry from '@sentry/react-router';
import { bunHttpServerIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: process.env.SENTRY_TUNNEL || 'http://127.0.0.1:47311/',
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.TRACE_LIFECYCLE === 'stream' ? 'stream' : 'static',
  debug: process.env.SENTRY_DEBUG === '1',
  integrations: process.env.BUN_HTTP === '0' ? [] : [bunHttpServerIntegration()],
});
