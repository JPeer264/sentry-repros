import { sentryBunPlugin } from '@sentry/bun/plugin';

const out = await Bun.build({
  entrypoints: ['./src/main-nest.ts'],
  outdir: './dist-nest',
  target: 'bun',
  sourcemap: 'external',
  external: [
    '@nestjs/microservices', '@nestjs/microservices/microservices-module',
    '@nestjs/websockets', '@nestjs/websockets/socket-module',
    '@nestjs/platform-express/multer', 'class-validator', 'class-transformer', 'cache-manager',
  ],
  plugins: [sentryBunPlugin()],
});
console.log('build success:', out.success);
