const Module = require('node:module');
Module.registerHooks({
  resolve(spec, ctx, next) { return next(spec, ctx); },
  load(url, ctx, next) { return next(url, ctx); },
});
try {
  console.log('json ok:', JSON.stringify(require('./data.json')));
} catch (e) {
  console.log('json FAILED:', e.constructor.name, e.message);
}
