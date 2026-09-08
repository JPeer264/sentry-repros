// Isolates the mechanism: does a subscribed diagnostics channel survive GC when only the
// diagnostics_channel module holds it? Run with bun, and with `node --expose-gc dc-gc.mjs`.
import dc from 'node:diagnostics_channel';

const fired = { held: 0, dropped: 0, plainDropped: 0 };

const held = dc.tracingChannel('held:query');
held.subscribe({ start: () => fired.held++ });

{
  const dropped = dc.tracingChannel('dropped:query');
  dropped.subscribe({ start: () => fired.dropped++ });
}

dc.subscribe('plaindropped', () => fired.plainDropped++);

function gc() {
  if (typeof Bun !== 'undefined') Bun.gc(true);
  else if (globalThis.gc) globalThis.gc();
}

gc();

setTimeout(() => {
  gc();
  console.log(
    'B timer after gc:',
    'held(lookup)=', dc.hasSubscribers('tracing:held:query:start'),
    'held(ref)=', held.start.hasSubscribers,
    'dropped(lookup)=', dc.hasSubscribers('tracing:dropped:query:start'),
    'plaindropped(lookup)=', dc.hasSubscribers('plaindropped'),
  );
  dc.channel('tracing:held:query:start').publish({});
  dc.channel('tracing:dropped:query:start').publish({});
  dc.channel('plaindropped').publish({});
  setTimeout(() => {
    console.log('C fired (expect 1 each):', JSON.stringify(fired));
  }, 50);
}, 100);
