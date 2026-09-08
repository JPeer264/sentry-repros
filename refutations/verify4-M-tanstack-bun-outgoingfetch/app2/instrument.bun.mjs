import * as Sentry from '@sentry/tanstackstart-react';
import { bunHttpServerIntegration, fetchIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@example.invalid/1',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  integrations: [fetchIntegration(), bunHttpServerIntegration()],
});

globalThis.__PROBE_SENTRY__ = Sentry;
console.log(`[probe] final client=${!!Sentry.getClient()} runtime=${typeof globalThis.Bun !== 'undefined' ? 'bun' : 'node'}`);
