import { createRequire, registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json') && !r.format) {
      return { ...r, format: 'json' };
    }
    return r;
  },
});

const require = createRequire(import.meta.url);

try {
  require('./req.cjs');
  console.log('RESULT e-format-json: ok');
} catch (e) {
  console.log(`RESULT e-format-json: FAIL ${e.name}: ${e.message}`);
}
