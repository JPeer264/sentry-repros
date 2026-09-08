import { fetchIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: process.env.PROBE_TUNNEL,
  tracesSampleRate: 1.0,
  debug: process.env.PROBE_DEBUG === '1',
  integrations: [fetchIntegration()],
});
