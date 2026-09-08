import dc from 'node:diagnostics_channel';
const NAME = 'probe:gc';
const held = dc.tracingChannel(NAME);
held.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
const check = () => dc.tracingChannel(NAME).start.hasSubscribers;
console.log('immediately:', check());
globalThis.Bun?.gc?.(true);
if (globalThis.gc) globalThis.gc();
console.log('after gc (ref held):', check());
// drop the strong ref scenario
(() => {
  const tmp = dc.tracingChannel('probe:gc2');
  tmp.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
})();
console.log('gc2 immediately:', dc.tracingChannel('probe:gc2').start.hasSubscribers);
globalThis.Bun?.gc?.(true);
if (globalThis.gc) globalThis.gc();
setTimeout(() => {
  globalThis.Bun?.gc?.(true);
  if (globalThis.gc) globalThis.gc();
  console.log('gc2 after gc:', dc.tracingChannel('probe:gc2').start.hasSubscribers);
  console.log('gc1 after gc (held):', check());
}, 1000);
