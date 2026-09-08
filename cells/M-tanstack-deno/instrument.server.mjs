import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  environment: 'qa',
  dsn: process.env.PROBE_DSN || 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: process.env.PROBE_TUNNEL || 'http://127.0.0.1:47313/',
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE === 'stream' ? 'stream' : 'static',
  debug: process.env.PROBE_DEBUG === '1',
});
