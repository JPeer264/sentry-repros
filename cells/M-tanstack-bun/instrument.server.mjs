import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  dsn: process.env.PROBE_DSN || 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: process.env.PROBE_TUNNEL,
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE === 'stream' ? 'stream' : 'static',
  debug: process.env.PROBE_DEBUG === '1',
});

globalThis.__PROBE_SENTRY__ = Sentry;
globalThis.__PROBE_RECORDER__ = process.env.PROBE_RECORDER;
console.log('[probe] sentry initialized, client =', !!Sentry.getClient());
