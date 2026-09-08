import * as Sentry from '@sentry/node';
import { getIsolationScope, getDefaultIsolationScope, withIsolationScope, getGlobalSingleton } from '@sentry/core';
Sentry.init({ dsn: 'https://abc@o1.ingest.sentry.io/1', tracesSampleRate: 1.0, autoSessionTracking: false,
  beforeSend(e) { console.log('EVENT', e.message, JSON.stringify(e.tags)); return null; } });
const carrier = globalThis.__SENTRY__;
console.log('acs keys', Object.keys(carrier || {}));
for (const k of Object.keys(carrier||{})) { const v = carrier[k]; if (v && typeof v==='object' && 'acs' in v) console.log('version', k, 'acs?', !!v.acs); }
async function req(tag, delay) {
  const iso = getIsolationScope();
  const isDefault = iso === getDefaultIsolationScope();
  const scope = isDefault ? iso.clone() : iso;
  return withIsolationScope(scope, async () => {
    getIsolationScope().setTag('probe_tag', tag);
    await new Promise(r => setTimeout(r, delay));
    Sentry.captureMessage(tag);
    console.log(tag, 'entryDefault=', isDefault, 'sameAtEnd=', getIsolationScope() === scope);
  });
}
await Promise.all([req('alpha', 300), req('beta', 60), req('gamma', 10)]);
await new Promise(r => setTimeout(r, 200));
console.log('after: iso is default?', getIsolationScope() === getDefaultIsolationScope(), JSON.stringify(getIsolationScope().getScopeData?.().tags));
