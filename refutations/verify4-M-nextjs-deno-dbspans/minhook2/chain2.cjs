const Module = require('node:module');
Module.registerHooks({
  load(url, ctx, next) {
    const r = next(url, ctx);
    if (url.endsWith('.json')) { console.log('HOOK-A', url, 'format=', r && r.format); if (r && r.format==='commonjs') r.format='json'; }
    return r;
  },
});
Module.registerHooks({
  load(url, ctx, next) {
    const r = next(url, ctx);
    if (url.endsWith('.json')) console.log('HOOK-B', url, 'format=', r && r.format);
    return r;
  },
});
try { console.log('json ok:', JSON.stringify(require('./data.json'))); }
catch (e) { console.log('json FAILED:', e.constructor.name, e.message); }
