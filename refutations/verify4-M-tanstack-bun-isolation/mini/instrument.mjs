import * as Sentry from '@sentry/tanstackstart-react';
Sentry.init({
  dsn: 'https://abc@o1.ingest.sentry.io/1',
  tunnel: process.env.SINK,
  tracesSampleRate: 1,
  traceLifecycle: process.env.LIFECYCLE || 'static',
  debug: process.env.SDEBUG === '1',
});
globalThis.__S__ = Sentry;
console.log('[probe] init, client =', !!Sentry.getClient());
