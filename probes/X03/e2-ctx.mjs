import { createRequire, registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('x.json')) {
      console.log('CTX x.json', JSON.stringify(context));
      console.log(
        'RES',
        JSON.stringify({ ...r, srcType: typeof r.source, srcHead: String(r.source).slice(0, 60), source: undefined }),
      );
      console.log('RES_KEYS', JSON.stringify(Object.keys(r)));
    }
    return r;
  },
});

const require = createRequire(import.meta.url);

try {
  require('./req.cjs');
  console.log('RESULT e2-ctx: ok');
} catch (e) {
  console.log(`RESULT e2-ctx: FAIL ${e.name}: ${e.message}`);
}
