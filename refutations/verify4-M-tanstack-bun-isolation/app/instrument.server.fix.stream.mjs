import * as Sentry from '@sentry/tanstackstart-react';
import { bunHttpServerIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1,
  integrations: [bunHttpServerIntegration()],
});
globalThis.__PROBE_SENTRY__ = Sentry;
console.log('[probe] stream lifecycle, client =', !!Sentry.getClient());
