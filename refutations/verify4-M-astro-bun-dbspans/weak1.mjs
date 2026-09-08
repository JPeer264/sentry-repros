import * as dc from 'node:diagnostics_channel';

// A: subscribe, drop the handle, then look again
(() => { dc.tracingChannel('w:a').subscribe({ start(){ console.log('A fired'); } }); })();
// B: subscribe and KEEP the handle alive on globalThis
globalThis.__kept = dc.tracingChannel('w:b');
globalThis.__kept.subscribe({ start(){ console.log('B fired'); } });

console.log('sync   A:', dc.tracingChannel('w:a').start.hasSubscribers, ' B:', dc.tracingChannel('w:b').start.hasSubscribers);
if (globalThis.Bun) Bun.gc(true);
console.log('afterGC A:', dc.tracingChannel('w:a').start.hasSubscribers, ' B:', dc.tracingChannel('w:b').start.hasSubscribers);
setTimeout(() => {
  console.log('+200ms A:', dc.tracingChannel('w:a').start.hasSubscribers, ' B:', dc.tracingChannel('w:b').start.hasSubscribers);
  dc.tracingChannel('w:a').traceSync(()=>1,{});
  dc.tracingChannel('w:b').traceSync(()=>1,{});
}, 200);
