import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dc = require('node:diagnostics_channel');
const kept = (globalThis.__keptChannels = []);
const origTracing = dc.tracingChannel;
const origChannel = dc.channel;
try {
  dc.tracingChannel = name => { const tc = origTracing(name); kept.push(tc); return tc; };
  dc.channel = name => { const c = origChannel(name); kept.push(c); return c; };
  console.log('[pinall2] patched CJS object ok');
} catch (e) { console.log('[pinall2] patch failed:', e.message); }
const ns = await import('node:diagnostics_channel');
console.log('[pinall2] ESM namespace sees patch:', ns.tracingChannel !== origTracing);
await import('./sentry.server.config.mjs');
