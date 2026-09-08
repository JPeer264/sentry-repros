import { registerHooks, createRequire } from 'node:module';
const require = createRequire(import.meta.url);
if (process.env.HOOK === '1') {
  registerHooks({
    resolve(spec, ctx, next) { return next(spec, ctx); },
    load(url, ctx, next) { return next(url, ctx); },
  });
  console.log('hooks registered');
}
try {
  console.log('json ok:', JSON.stringify(require('./x.json')));
} catch (e) {
  console.log('json FAIL:', e.constructor.name, e.message);
}
