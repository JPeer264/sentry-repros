import * as dc from 'node:diagnostics_channel';
(() => {
  const tc = dc.tracingChannel('gc:probe');
  tc.subscribe({ start() { console.log('  SUBSCRIBER RAN'); } });
  console.log('after subscribe, hasSubscribers:', tc.start.hasSubscribers);
})();
if (globalThis.Bun) Bun.gc(true); else if (global.gc) global.gc();
const fresh = dc.tracingChannel('gc:probe');
console.log('after GC,  hasSubscribers:', fresh.start.hasSubscribers);
fresh.traceSync(() => 1, {});
