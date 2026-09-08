import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./app.ts', './app-perreq.ts', './app-perreq-static.ts'],
  outdir: './dist',
  target: 'bun',
  external: ['@sentry/*'],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
console.log('built', result.outputs.map(o => o.path).join(' '));
