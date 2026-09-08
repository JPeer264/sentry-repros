// Variant G build: exactly "@sentry/nestjs" external, "@sentry/nestjs/setup" bundled.
// Bun's `external` entry for a bare package name also covers its subpaths, so the split
// has to be expressed as an onResolve hook.
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

const externalSentryExceptSetup = {
  name: 'external-sentry-except-nestjs-setup',
  setup(build) {
    build.onResolve({ filter: /^@sentry\// }, args => {
      if (args.path === '@sentry/nestjs/setup') {
        return undefined;
      }
      return { path: args.path, external: true };
    });
  },
};

const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist4',
  target: 'bun',
  external: [...NEST_OPTIONAL_PEERS],
  sourcemap: 'external',
  plugins: [externalSentryExceptSetup, sentryBunPlugin()],
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log('built dist4/');
