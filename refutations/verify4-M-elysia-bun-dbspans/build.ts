import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: process.env.OUTDIR ?? './dist',
  target: 'bun',
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
if (!result.success) { console.error('BUILD_FAILED', result.logs); process.exit(1); }
console.log('BUILD_OK');
