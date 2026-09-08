import { tracingChannel } from 'node:diagnostics_channel';
import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();

// dropped reference
(() => { const t = tracingChannel('gc-dropped'); t.start.bindStore(als, d => d); })();
// kept reference
globalThis.__kept = tracingChannel('gc-kept');
globalThis.__kept.start.bindStore(als, d => d);
// dropped, but plain subscribe instead of bindStore
(() => { const t = tracingChannel('gc-sub'); t.subscribe({ start() {} }); })();

console.log('immediately: dropped=', tracingChannel('gc-dropped').start.hasSubscribers,
  'kept=', tracingChannel('gc-kept').start.hasSubscribers,
  'sub=', tracingChannel('gc-sub').start.hasSubscribers);
setTimeout(() => {
  if (typeof Bun !== 'undefined') Bun.gc(true);
  else if (globalThis.gc) globalThis.gc();
  console.log('after gc: dropped=', tracingChannel('gc-dropped').start.hasSubscribers,
    'kept=', tracingChannel('gc-kept').start.hasSubscribers,
    'sub=', tracingChannel('gc-sub').start.hasSubscribers);
}, 50);
