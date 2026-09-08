const a = require('diagnostics_channel');
const b = require('node:diagnostics_channel');
console.log('same module object?', a === b, 'same tracingChannel fn?', a.tracingChannel === b.tracingChannel);
const ca = a.channel('x:y'); const cb = b.channel('x:y');
console.log('same plain channel object?', ca === cb);
ca.subscribe(() => console.log('plain sub fired'));
console.log('cb.hasSubscribers', cb.hasSubscribers, 'ca.hasSubscribers', ca.hasSubscribers);
cb.publish({});
