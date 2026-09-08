import { sentryBunPlugin } from '@sentry/bun/plugin';

const mode = process.env.BUILD_MODE ?? 'default';

const external = [
  '@sentry/remix',
  '@sentry/node',
  '@sentry/core',
  '@sentry/bun',
  '@sentry/server-utils',
  '@sentry/opentelemetry',
  '@sentry/server-runtime-injection',
];

if (mode === 'glob-remix-external') {
  external.push('@remix-run/*');
} else if (mode === 'express-adapter-external') {
  external.push('@remix-run/express');
}

const outdir = `./dist-${mode}`;

const res = await Bun.build({
  entrypoints: ['./server.mjs'],
  outdir,
  target: 'bun',
  external,
  plugins: [sentryBunPlugin()],
});
if (!res.success) {
  console.error(res.logs);
  process.exit(1);
}
console.log('built', outdir, 'mode', mode);
