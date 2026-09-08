import * as Sentry from '@sentry/node';
import { fetchIntegration as bunFetchIntegration } from '@sentry/bun';

const useBunFetch = process.env.BUN_FETCH === '1';
Sentry.init({
  dsn: 'https://abc@o1.ingest.sentry.io/1',
  tunnel: process.env.SINK,
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  integrations: useBunFetch ? [bunFetchIntegration()] : [],
});
console.log('runtime', typeof Bun !== 'undefined' ? 'bun ' + Bun.version : 'node ' + process.version, 'bunFetch=', useBunFetch);
await Sentry.startSpan({ name: 'outer', op: 'test' }, async () => {
  const r = await fetch(process.env.REC);
  await r.text();
});
await Sentry.flush(3000);
