import * as Sentry from '@sentry/tanstackstart-react';
import { bunHttpServerIntegration } from '@sentry/bun';

Sentry.init({
  dsn: 'http://public@127.0.0.1:43117/1337',
  tunnel: 'http://127.0.0.1:43117/',
  tracesSampleRate: 1.0,
  integrations: [bunHttpServerIntegration()],
});

globalThis.__PROBE_SENTRY__ = Sentry;
console.log('[probe] documented-shape bun instrument, client =', !!Sentry.getClient());
