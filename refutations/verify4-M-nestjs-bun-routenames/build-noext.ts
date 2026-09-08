import { sentryBunPlugin } from '@sentry/bun/plugin';

const out = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist-noext',
  target: 'bun',
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
console.log('build success:', out.success);
