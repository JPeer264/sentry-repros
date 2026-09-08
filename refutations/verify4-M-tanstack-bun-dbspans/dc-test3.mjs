import nodeDc from 'node:diagnostics_channel';
import bareDc from 'diagnostics_channel';
console.log('same module object:', nodeDc === bareDc);
const a = nodeDc.tracingChannel('probe:x');
a.subscribe({ start(){console.log('fired via node: subscriber')}, end(){}, asyncStart(){}, asyncEnd(){}, error(){} });
const b = bareDc.tracingChannel('probe:x');
console.log('bare channel sees subscriber:', b.start.hasSubscribers);
b.start.publish({});
