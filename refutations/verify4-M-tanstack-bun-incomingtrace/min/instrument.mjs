import * as Sentry from '@sentry/tanstackstart-react';
const extra = [];
if (process.env.PROBE_BUN_HTTP === '1') {
  const Bun = await import('@sentry/bun');
  extra.push(Bun.bunHttpServerIntegration());
}
Sentry.init({
  dsn: 'http://public@127.0.0.1:41601/1337',
  tunnel: 'http://127.0.0.1:41601/',
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE || 'static',
  integrations: extra,
  debug: process.env.PROBE_DEBUG === '1',
});
globalThis.__S = Sentry;
console.log('[probe] init, client =', !!Sentry.getClient());
