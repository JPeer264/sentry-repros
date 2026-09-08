import dc from 'node:diagnostics_channel';
function subscribeAndDrop() {
  const tc = dc.tracingChannel('probe:gc');
  tc.subscribe({ start: () => console.log('EVT start'), end: () => {}, asyncStart: () => {}, asyncEnd: () => {}, error: () => {} });
}
subscribeAndDrop();
console.log('right after', dc.tracingChannel('probe:gc').start?.hasSubscribers);
Bun.gc(true);
console.log('after gc', dc.tracingChannel('probe:gc').start?.hasSubscribers);
setTimeout(() => {
  console.log('after tick', dc.tracingChannel('probe:gc').start?.hasSubscribers);
  // publish through a fresh instance
  const tc = dc.tracingChannel('probe:gc');
  tc.traceCallback((cb) => cb(null, 1), 0, {}, null, () => {});
}, 30);

// retained variant
const kept = dc.tracingChannel('probe:keep');
kept.subscribe({ start: () => console.log('KEPT start'), end: () => {}, asyncStart: () => {}, asyncEnd: () => {}, error: () => {} });
setTimeout(() => {
  console.log('kept after tick', dc.tracingChannel('probe:keep').start?.hasSubscribers, kept.start?.hasSubscribers);
  dc.tracingChannel('probe:keep').traceCallback((cb) => cb(null, 1), 0, {}, null, () => {});
}, 40);
