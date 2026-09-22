// Compares 3 ways to subscribe, then checks the subscription after a GC in a later task.
const dc = require('node:diagnostics_channel');
if (typeof Bun === 'undefined' && !globalThis.gc) {
  require('v8').setFlagsFromString('--expose-gc');
  globalThis.gc = require('vm').runInNewContext('gc');
}
const gc = typeof Bun !== 'undefined' ? () => Bun.gc(true) : globalThis.gc;

dc.channel('a').subscribe(() => {});
dc.subscribe('b', () => {});
dc.tracingChannel('c').subscribe({ start() {} });

setTimeout(() => {
  gc();
  setTimeout(() => {
    console.log(
      JSON.stringify({
        'channel(name).subscribe': dc.channel('a').hasSubscribers,
        'diagnostics_channel.subscribe(name)': dc.channel('b').hasSubscribers,
        'tracingChannel(name).subscribe': dc.channel('tracing:c:start').hasSubscribers,
      }),
    );
  }, 0);
}, 0);
