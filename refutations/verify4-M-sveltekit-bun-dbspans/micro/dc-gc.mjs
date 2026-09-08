import * as dc from 'node:diagnostics_channel';
// subscribe without keeping a reference
(() => { const ch = dc.tracingChannel('probe:chan'); ch.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} }); })();
console.log('immediately:', dc.tracingChannel('probe:chan').start.hasSubscribers);
if (globalThis.Bun) Bun.gc(true);
console.log('after gc:', dc.tracingChannel('probe:chan').start.hasSubscribers);
// with a retained reference
const kept = dc.tracingChannel('probe:kept');
kept.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
if (globalThis.Bun) Bun.gc(true);
console.log('kept after gc:', dc.tracingChannel('probe:kept').start.hasSubscribers);
setTimeout(() => {
  console.log('later unkept:', dc.tracingChannel('probe:chan').start.hasSubscribers);
  console.log('later kept:', dc.tracingChannel('probe:kept').start.hasSubscribers);
  // also: does subscribing to the raw channel object survive?
}, 300);
