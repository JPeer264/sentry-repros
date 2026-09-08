import { createRequire, registerHooks } from 'node:module';

const seen = [];

registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    seen.push(`${url.split('/').pop()} format=${r.format} source=${typeof r.source}`);
    return r;
  },
});

const require = createRequire(import.meta.url);

try {
  require('./req.cjs');
  console.log('RESULT b-noop: ok');
} catch (e) {
  console.log(`RESULT b-noop: FAIL ${e.name}: ${e.message}`);
}
console.log('LOAD_SEEN', JSON.stringify(seen));
