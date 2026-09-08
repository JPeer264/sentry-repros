import * as Sentry from '@sentry/solidstart';
import { definePlugin } from 'nitro';

export default definePlugin(nitroApp => {
  Sentry.init({
    dsn: 'https://public@localhost/1',
    tunnel: process.env.SENTRY_TUNNEL,
    tracesSampleRate: 1.0,
    traceLifecycle: (process.env.SENTRY_LIFECYCLE as 'static' | 'stream') || 'static',
    debug: !!process.env.SENTRY_DEBUG,
  });

  if (process.env.PROBE_NITRO_HOOK) {
    nitroApp.hooks.hook('error', (error: unknown) => {
      Sentry.captureException(error, {
        mechanism: { handled: false, type: 'probe.nitro.error.hook' },
      });
    });
  }
});
