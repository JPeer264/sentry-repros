import { sentryBunPlugin } from '@sentry/bun/plugin';

await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist-ext',
  target: 'bun',
  external: ['@sentry/*', 'hono'],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
