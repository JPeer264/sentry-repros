import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./app-db.ts'],
  target: 'bun',
  compile: { outfile: './node_modules/.b11-bin/app-db-plugin' },
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});
console.log('build-db.ts success=%s', result.success);
