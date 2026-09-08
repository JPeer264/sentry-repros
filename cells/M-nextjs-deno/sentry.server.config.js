import * as Sentry from '@sentry/nextjs';

// PROBE_INJECTION_ON=1 restores the default docs wiring (injection enabled) to reproduce the crash.
const injection = !!process.env.PROBE_INJECTION_ON;

if (!process.env.PROBE_SENTRY_OFF) {
  Sentry.init({
    dsn: 'https://abcdef0123456789abcdef0123456789@o0.ingest.sentry.io/0',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: process.env.SENTRY_LIFECYCLE || 'static',
    debug: !!process.env.SENTRY_DEBUG,
    // Required on Deno: Module.registerHooks() makes every require() of a .json file throw.
    enableRuntimeChannelInjection: injection,
  });
}
