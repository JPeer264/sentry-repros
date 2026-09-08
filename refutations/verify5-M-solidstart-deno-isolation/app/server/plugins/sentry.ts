import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';

export default definePlugin(() => {
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: process.env.SENTRY_TUNNEL || 'http://127.0.0.1:41871/',
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: !!process.env.SENTRY_DEBUG,
  });
  (globalThis as any).__probeDefaultIso = Sentry.getIsolationScope();
  (globalThis as any).__probeInitCurrent = Sentry.getCurrentScope();
});
