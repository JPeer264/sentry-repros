// src/server-plugin.ts — server errors for SolidStart on Cloudflare Workers.
//
// Register in app.config.ts:
//   export default defineConfig({
//     server: {
//       preset: 'cloudflare-module',
//       plugins: ['./src/server-plugin.ts'],
//       rollupConfig: { external: ['@sentry/cloudflare'] },
//     },
//   });
//
// Without this plugin, Nitro/h3 catches everything a route handler throws, logs
// "[request error] [unhandled]" and answers 500, so withSentry only sees the 500 and
// no error event is created. This is the same hook @sentry/nitro and
// @sentry/nuxt (sentryCloudflareNitroPlugin) register on Node/Cloudflare.
import * as Sentry from '@sentry/cloudflare';

export default function sentryNitroPlugin(nitroApp: any) {
  nitroApp.hooks.hook('error', (error: any, errorContext: any) => {
    const status = error?.statusCode ?? error?.status;
    if (typeof status === 'number' && status >= 300 && status < 500) {
      return;
    }

    Sentry.captureException(error, {
      captureContext: {
        contexts: {
          nitro: {
            method: errorContext?.event?.method ?? errorContext?.event?.node?.req?.method,
            path: errorContext?.event?.path,
          },
        },
      },
      mechanism: { handled: false, type: 'auto.function.nitro.captureErrorHook' },
    });
  });
}
