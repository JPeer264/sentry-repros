import { tracingChannel, channel } from 'node:diagnostics_channel';
const a = tracingChannel('t1');
const b = tracingChannel('t1');
console.log('tcIdentical', a === b, 'startIdentical', a.start === b.start, 'startIsNamedChannel', a.start === channel('t1:start'));
a.subscribe({ start() { console.log('  A-handler fired'); } });
console.log('a.hasSubscribers', a.hasSubscribers, 'b.start.hasSubscribers', b.start?.hasSubscribers, 'namedChannel.hasSubscribers', channel('t1:start').hasSubscribers);
b.traceSync(() => {}, {});
console.log('--- traced via b, done');
