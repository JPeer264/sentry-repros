import { sentryBunPlugin } from '@sentry/bun/plugin';

await Bun.build({
  entrypoints: ['./app2.ts'],
  outdir: './dist',
  target: 'bun',
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
