// Variant F build: everything Sentry and everything Nest stays external.
import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist3',
  target: 'bun',
  external: ['@sentry/*', '@nestjs/*', 'class-transformer', 'class-transformer/*', 'class-validator', 'class-validator/*'],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log('built dist3/');
