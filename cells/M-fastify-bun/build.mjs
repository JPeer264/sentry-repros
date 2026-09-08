import { sentryBunPlugin } from '@sentry/bun/plugin';

await Bun.build({
  entrypoints: ['./app.mjs'],
  outdir: './dist',
  target: 'bun',
  external: ['@sentry/*'],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
console.log('built dist/app.js');
