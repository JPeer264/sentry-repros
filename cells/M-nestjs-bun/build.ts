import { sentryBunPlugin } from '@sentry/bun/plugin';

await Bun.build({
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
