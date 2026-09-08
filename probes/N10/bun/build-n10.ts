import { sentryBunPlugin } from '@sentry/bun/plugin';

await Bun.build({
  entrypoints: ['./n10.ts'],
  outdir: './dist-n10',
  target: 'bun',
  external: ['@sentry/*'],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
