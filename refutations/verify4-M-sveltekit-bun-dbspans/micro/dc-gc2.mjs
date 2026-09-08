import * as dc from 'node:diagnostics_channel';
const kept = dc.tracingChannel('k');
kept.subscribe({ start(){ console.log('START FIRED'); }, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
const rawStart = dc.channel('tracing:k:start');
console.log('same channel object?', dc.tracingChannel('k').start === kept.start, dc.channel('tracing:k:start') === kept.start);
setTimeout(() => {
  if (globalThis.Bun) Bun.gc(true);
  console.log('kept.start.hasSubscribers', kept.start.hasSubscribers);
  console.log('fresh lookup hasSubscribers', dc.tracingChannel('k').start.hasSubscribers);
  console.log('rawStart.hasSubscribers', rawStart.hasSubscribers);
  console.log('same after?', dc.tracingChannel('k').start === kept.start);
  dc.tracingChannel('k').traceSync(() => {}, {});
  kept.traceSync(() => {}, {});
}, 200);
