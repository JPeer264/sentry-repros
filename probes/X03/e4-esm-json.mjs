import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    return nextLoad(url, context);
  },
});

try {
  const m = await import('./x.json', { with: { type: 'json' } });
  console.log(`RESULT e4-esm-json: ok ${JSON.stringify(m.default)}`);
} catch (e) {
  console.log(`RESULT e4-esm-json: FAIL ${e.name}: ${e.message}`);
}
