import * as Sentry from '@sentry/tanstackstart-react';

const extra = [];
if (process.env.PROBE_BUN_HTTP === '1') {
  const Bun = await import('@sentry/bun');
  extra.push(Bun.bunHttpServerIntegration({ spans: process.env.PROBE_BUN_HTTP_SPANS !== '0' }));
}

const SINK = process.env.PROBE_SINK || 'http://127.0.0.1:43117/';

Sentry.init({
  dsn: 'http://public@127.0.0.1:43117/1337',
  tunnel: SINK,
  tracesSampleRate: 1,
  traceLifecycle: process.env.PROBE_LIFECYCLE || 'static',
  integrations: extra,
  debug: process.env.PROBE_DEBUG === '1',
});

globalThis.__PROBE_SENTRY__ = Sentry;
console.log('[probe] sentry initialized, client =', !!Sentry.getClient(), 'bunHttp =', process.env.PROBE_BUN_HTTP === '1');
