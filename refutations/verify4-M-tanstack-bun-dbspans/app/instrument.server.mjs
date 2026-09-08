import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  dsn: 'http://public@localhost:41733/1337',
  tunnel: 'http://127.0.0.1:41733/',
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE ?? 'static',
  debug: true,
});

globalThis.__PROBE_SENTRY__ = Sentry;
console.log('[probe] sentry initialized, client =', !!Sentry.getClient());
