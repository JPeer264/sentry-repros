import * as Sentry from '@sentry/node';
import { bunHttpServerIntegration } from '@sentry/bun';

const extra = process.env.BUN_HTTP === '1' ? [bunHttpServerIntegration({ spans: process.env.BUN_HTTP_SPANS !== '0' })] : [];

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1,
  traceLifecycle: 'static',
  debug: process.env.SDK_DEBUG === '1',
  integrations: extra,
});
globalThis.__S = Sentry;
console.log('[probe] client =', !!Sentry.getClient(), 'bunHttp =', process.env.BUN_HTTP === '1');
