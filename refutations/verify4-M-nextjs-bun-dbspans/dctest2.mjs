import dc from 'node:diagnostics_channel';
const tc = dc.tracingChannel('probe:chan');
tc.subscribe({ start: () => console.log('EVT start'), asyncStart: () => console.log('EVT asyncStart'), asyncEnd: () => console.log('EVT asyncEnd'), end: () => console.log('EVT end'), error: () => console.log('EVT error') });
console.log('traceCallback type', typeof tc.traceCallback);
tc.traceCallback((x, cb) => setTimeout(() => cb(null, x), 5), 1, { a: 1 }, null, 42, (err, v) => console.log('cb done', v));
setTimeout(() => {
  // same-name channel via a second tracingChannel() call
  const tc2 = dc.tracingChannel('probe:chan');
  console.log('tc2 start.hasSubscribers', tc2.start?.hasSubscribers);
  // process.getBuiltinModule variant, as mysql2 uses
  const dc2 = process.getBuiltinModule('node:diagnostics_channel');
  console.log('dc2 === dc ?', dc2 === dc, 'dc2.default===dc?', dc2?.default === dc);
  const tc3 = dc2.tracingChannel('probe:chan');
  console.log('tc3 start.hasSubscribers', tc3.start?.hasSubscribers, 'hasSubscribers', tc3.hasSubscribers);
  tc3.traceCallback((cb) => setTimeout(() => cb(null, 1), 5), 0, {}, null, (e, v) => console.log('cb3 done', v));
}, 50);
