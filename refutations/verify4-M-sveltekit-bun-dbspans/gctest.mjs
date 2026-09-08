import dc from 'node:diagnostics_channel';
const ch = dc.tracingChannel('probe:chan');
ch.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
console.log('t0:', dc.tracingChannel('probe:chan').start.hasSubscribers);
// drop local ref
setTimeout(() => {
  if (typeof Bun !== 'undefined') Bun.gc(true);
  console.log('after gc:', dc.tracingChannel('probe:chan').start.hasSubscribers);
}, 20);

// keep a strong ref variant
const ch2 = dc.tracingChannel('probe:chan2');
globalThis.__keep = ch2;
ch2.subscribe({ start(){}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
setTimeout(() => {
  console.log('kept after gc:', dc.tracingChannel('probe:chan2').start.hasSubscribers);
}, 25);
