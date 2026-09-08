import '@sentry/deno/import';
import { registerHooks } from 'node:module';
import { sentinel } from './init.mjs';

// Registered after the Sentry hook so it wraps it: Deno's nextLoad() reports no
// format for .json, which makes its CJS loader compile the JSON text as JS.
registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json') && !r.format) {
      return { ...r, format: 'json' };
    }
    return r;
  },
});

let result;
try {
  const m = await import('express');
  const injected = globalThis.__SENTRY_ORCHESTRION__?.runtime;
  result = `ok typeof=${typeof (m.default ?? m)} injected=${JSON.stringify(injected)}`;
} catch (e) {
  result = `FAIL ${e.name}: ${e.message}`;
}
console.log(`RESULT f-sentry-fixed: ${result}`);
await sentinel(`sentinel f-sentry-fixed ${result.split(' ')[0]}`);
