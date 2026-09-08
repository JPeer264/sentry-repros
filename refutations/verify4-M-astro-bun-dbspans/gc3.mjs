import * as dc from 'node:diagnostics_channel';
(() => {
  const tc = dc.tracingChannel('gc:noforce');
  tc.subscribe({ start() {} });
})();
console.log('no forced GC, sync:', dc.tracingChannel('gc:noforce').start.hasSubscribers);
setTimeout(() => console.log('no forced GC, +0ms:', dc.tracingChannel('gc:noforce').start.hasSubscribers), 0);
setTimeout(() => console.log('no forced GC, +500ms:', dc.tracingChannel('gc:noforce').start.hasSubscribers), 500);
