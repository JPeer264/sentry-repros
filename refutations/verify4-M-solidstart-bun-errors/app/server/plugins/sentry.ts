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

  if (process.env.SENTRY_ERROR_HOOK) {
    nitroApp.hooks.hook('error', (error: Error, ctx: any) => {
      // eslint-disable-next-line no-console
      console.log('[probe] nitro error hook fired:', error?.message);
      Sentry.captureException(error, {
        mechanism: { handled: false, type: 'auto.function.nitro.captureErrorHook' },
      });
    });
    console.log('[probe] registered nitro error hook');
  }
});
