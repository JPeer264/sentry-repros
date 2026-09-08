import dc from 'node:diagnostics_channel';
// hold a DIFFERENT wrapper for the same name
globalThis.__keep = dc.tracingChannel('probe:x');
(function(){ const a = dc.tracingChannel('probe:x'); a.subscribe({start(){},end(){},asyncStart(){},asyncEnd(){},error(){}}); })();
setTimeout(() => { if (typeof Bun !== 'undefined') Bun.gc(true); console.log('separate-wrapper kept:', dc.tracingChannel('probe:x').start.hasSubscribers); }, 20);

// hold the raw channels instead
globalThis.__keep2 = ['probe:y:start','probe:y:end','probe:y:asyncStart','probe:y:asyncEnd','probe:y:error'].map(n => dc.channel(n));
(function(){ const a = dc.tracingChannel('probe:y'); a.subscribe({start(){},end(){},asyncStart(){},asyncEnd(){},error(){}}); })();
setTimeout(() => { if (typeof Bun !== 'undefined') Bun.gc(true); console.log('raw-channels kept:', dc.tracingChannel('probe:y').start.hasSubscribers); }, 25);
