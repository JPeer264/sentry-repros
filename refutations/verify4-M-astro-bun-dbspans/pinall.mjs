// Generic form of the workaround: retain every channel this process ever creates.
import * as dc from 'node:diagnostics_channel';
const kept = (globalThis.__keptChannels = []);
const origChannel = dc.channel;
const origTracing = dc.tracingChannel;
dc.channel = name => { const c = origChannel(name); kept.push(c); return c; };
dc.tracingChannel = name => { const tc = origTracing(name); kept.push(tc); return tc; };
await import('./sentry.server.config.mjs');
