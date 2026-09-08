const Module = require('node:module');
Module.registerHooks({
  load(url, ctx, next) {
    const r = next(url, ctx);
    if (url.endsWith('.json') && r) r.format = 'json';
    return r;
  },
});
Module.registerHooks({ resolve: (s,c,n)=>n(s,c), load: (u,c,n)=>n(u,c) });
try { console.log('json ok:', JSON.stringify(require('./data.json'))); }
catch (e) { console.log('json FAILED:', e.constructor.name, e.message); }
try { console.log('js ok:', require('./dep.cjs').v); } catch (e) { console.log('js FAILED:', e.message); }
