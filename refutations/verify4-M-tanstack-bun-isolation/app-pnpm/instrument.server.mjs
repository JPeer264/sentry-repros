import * as Sentry from '@sentry/tanstackstart-react';

Sentry.init({
  environment: 'qa',
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: process.env.SINK,
  tracesSampleRate: 1,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  debug: process.env.SDEBUG === '1',
});
console.log('[probe] sentry initialized, client =', !!Sentry.getClient());
