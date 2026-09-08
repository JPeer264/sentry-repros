const Module = require('node:module');
// registered FIRST: runs LAST in the chain (closest to the default loader)
Module.registerHooks({
  load(url, ctx, next) {
    const r = next(url, ctx);
    if (url.endsWith('.json') && r && r.format === 'commonjs') r.format = 'json';
    return r;
  },
});
// registered SECOND: simulates Sentry's passthrough sync hooks
Module.registerHooks({
  resolve: (s, c, n) => n(s, c),
  load: (u, c, n) => n(u, c),
});
try { console.log('json ok:', JSON.stringify(require('./data.json'))); }
catch (e) { console.log('json FAILED:', e.constructor.name, e.message); }
try { console.log('js ok:', require('./dep.cjs').v); }
catch (e) { console.log('js FAILED:', e.constructor.name, e.message); }
