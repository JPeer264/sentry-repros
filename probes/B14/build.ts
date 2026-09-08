// Variant B/A/C/D build: the documented `external: ["@sentry/*"]` plugin build.
import { sentryBunPlugin } from '@sentry/bun/plugin';

const NEST_OPTIONAL_PEERS = [
  '@nestjs/microservices',
  '@nestjs/microservices/*',
  '@nestjs/websockets',
  '@nestjs/websockets/*',
  'class-transformer',
  'class-transformer/*',
  'class-validator',
  'class-validator/*',
];

const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist',
  target: 'bun',
  external: ['@sentry/*', ...NEST_OPTIONAL_PEERS],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log('built dist/');
