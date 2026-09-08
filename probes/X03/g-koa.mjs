import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    const r = nextLoad(url, context);
    if (url.endsWith('.json') && !r.format) {
      return { ...r, format: 'json' };
    }
    return r;
  },
});

try {
  const m = await import('koa');
  console.log(`RESULT g-koa: ok typeof=${typeof (m.default ?? m)}`);
} catch (e) {
  console.log(`RESULT g-koa: FAIL ${e.name}: ${e.message}`);
  console.log(e.stack);
}
