import { sentryBunPlugin } from '@sentry/bun/plugin';

const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  target: 'bun',
  sourcemap: 'external',
  external: [
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@nestjs/platform-express/multer',
    'class-validator',
    'class-transformer',
    'cache-manager',
  ],
  plugins: [sentryBunPlugin()],
});
if (!result.success) {
  console.error('BUILD_FAILED', result.logs);
  process.exit(1);
}
console.log('BUILD_OK');
