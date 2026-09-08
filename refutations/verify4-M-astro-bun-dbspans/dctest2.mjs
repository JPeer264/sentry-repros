import * as dc from 'node:diagnostics_channel';
const a = dc.tracingChannel('t:one');
const b = dc.tracingChannel('t:one');
console.log('before sub: a.hasSubscribers', a.hasSubscribers, 'b.hasSubscribers', b.hasSubscribers);
a.subscribe({ start(){ console.log('start fired'); } });
console.log('after sub on a: a.hasSubscribers', a.hasSubscribers, 'b.hasSubscribers', b.hasSubscribers);
console.log('a.start.hasSubscribers', a.start.hasSubscribers, 'b.start.hasSubscribers', b.start.hasSubscribers);
b.traceSync(() => 1, {});
// also test subscribe via channel.subscribe on start only
const c = dc.tracingChannel('t:two');
const d = dc.tracingChannel('t:two');
c.start.subscribe(()=>{});
console.log('start-only sub: d.hasSubscribers', d.hasSubscribers);
