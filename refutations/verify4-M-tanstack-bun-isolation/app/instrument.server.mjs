import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1,
  traceLifecycle: 'static',
});
globalThis.__PROBE_SENTRY__ = Sentry;
console.log('[probe] sentry initialized, client =', !!Sentry.getClient());
