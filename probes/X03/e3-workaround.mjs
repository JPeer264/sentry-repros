import { createRequire, registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json') && !r.format) {
      return { format: 'commonjs', source: `module.exports=${String(r.source)}`, shortCircuit: true };
    }
    return r;
  },
});

const require = createRequire(import.meta.url);

try {
  const d = require('./req.cjs');
  console.log(`RESULT e3-workaround: ok ${JSON.stringify(d)}`);
} catch (e) {
  console.log(`RESULT e3-workaround: FAIL ${e.name}: ${e.message}`);
}
