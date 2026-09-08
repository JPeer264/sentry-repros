// Variant E build: @sentry/nestjs is bundled (only the runtime SDK packages stay external).
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
  outdir: './dist2',
  target: 'bun',
  external: ['@sentry/bun', '@sentry/core', '@sentry/node', '@sentry/server-utils', '@sentry/conventions', ...NEST_OPTIONAL_PEERS],
  sourcemap: 'external',
  plugins: [sentryBunPlugin()],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log('built dist2/');
