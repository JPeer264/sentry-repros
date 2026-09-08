import { sentryBunPlugin } from '@sentry/bun/plugin';

// No `external` on purpose: externalizing @sentry/* splits `hono` (bundled) from
// `@sentry/hono` (external), so the Hono patches land on a different Hono copy.
await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist',
  target: 'bun',
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
