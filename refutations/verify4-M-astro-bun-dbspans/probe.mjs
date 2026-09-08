import './sentry.server.config.mjs';
import * as dc from 'node:diagnostics_channel';
const names = ['orchestrion:mysql2:query', 'orchestrion:mysql:query'];
for (const n of names) {
  const tc = dc.tracingChannel(n);
  tc.subscribe({
    start() { console.log('[PROBE] start fired', n); },
    end() { console.log('[PROBE] end fired', n); },
    asyncStart() { console.log('[PROBE] asyncStart fired', n); },
  });
}
setTimeout(() => {
  for (const n of names) {
    const tc = dc.tracingChannel(n);
    console.log('[PROBE]', n, 'start.hasSubscribers=', tc.start.hasSubscribers, 'asyncStart.hasSubscribers=', tc.asyncStart.hasSubscribers, 'end=', tc.end.hasSubscribers, 'error=', tc.error.hasSubscribers);
  }
}, 2000).unref?.();
