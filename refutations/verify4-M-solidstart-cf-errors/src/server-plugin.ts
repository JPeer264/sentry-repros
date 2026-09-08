// Nitro plugin: turns errors that Nitro/h3 catches into Sentry events on Cloudflare Workers.
// Register with `server: { plugins: ['./src/server-plugin.ts'] }` in app.config.ts.
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
