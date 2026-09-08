import * as dc from 'node:diagnostics_channel';
{
  const tc = dc.tracingChannel('gc:test');
  tc.subscribe({ start(){ console.log('start fired'); } });
  console.log('immediately after subscribe:', tc.start.hasSubscribers);
}
Bun.gc?.(true);
const again = dc.tracingChannel('gc:test');
console.log('after gc, fresh handle:', again.start.hasSubscribers);
again.traceSync(()=>1,{});
console.log('---- with strong ref kept');
const kept = dc.tracingChannel('gc:test2');
kept.subscribe({ start(){ console.log('start2 fired'); } });
Bun.gc?.(true);
console.log('kept:', dc.tracingChannel('gc:test2').start.hasSubscribers);
