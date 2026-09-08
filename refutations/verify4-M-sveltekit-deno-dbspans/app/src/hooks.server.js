import { createRequire } from 'node:module';

if (process.env.PREWARM_JSON === '1') {
  // Deno bug denoland/deno#36240: with Module.registerHooks() active, require('*.json')
  // is compiled as JavaScript. Loading mysql2's package.json into the CJS cache before
  // Sentry registers its hooks keeps mysql2 importable.
  createRequire(import.meta.url)('mysql2/package.json');
}

const Sentry = await import('@sentry/sveltekit');

Sentry.init({
  dsn: 'https://public@example.com/1',
  tunnel: 'http://127.0.0.1:41777/',
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.LIFECYCLE || 'stream',
  debug: !!process.env.SENTRY_DEBUG,
});

export const handle = Sentry.sentryHandle();
export const handleError = Sentry.handleErrorWithSentry(() => {});
