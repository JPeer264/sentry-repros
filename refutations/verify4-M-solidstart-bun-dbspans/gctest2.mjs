import dc from 'node:diagnostics_channel';
const gc = globalThis.Bun ? () => Bun.gc(true) : (globalThis.gc || (() => {}));
const doGc = process.env.GC !== '0';
const hits = { none: 0, wrapper: 0, startch: 0 };
dc.tracingChannel('probe:none').start.subscribe(() => { hits.none++; });
const keepWrapper = dc.tracingChannel('probe:wrapper');
keepWrapper.start.subscribe(() => { hits.wrapper++; });
const w = dc.tracingChannel('probe:startch');
const keepStart = [w.start, w.end, w.asyncStart, w.asyncEnd, w.error];
keepStart[0].subscribe(() => { hits.startch++; });
if (doGc) { gc(); gc(); }
await new Promise(r => setTimeout(r, 50));
if (doGc) { gc(); gc(); }
for (const n of ['none', 'wrapper', 'startch']) dc.tracingChannel('probe:' + n).traceSync(() => {}, {});
console.log(JSON.stringify({ runtime: globalThis.Bun ? 'bun' : 'node', gc: doGc, ...hits, keep: !!keepWrapper && !!keepStart }));
