import { sentryBunPlugin } from '@sentry/bun/plugin';

const entry = process.env.ENTRY || './server.mjs';
const outdir = process.env.OUTDIR || './dist';
const extraExternal = (process.env.EXTRA_EXTERNAL || '').split(',').filter(Boolean);

const res = await Bun.build({
  entrypoints: [entry],
  outdir,
  target: 'bun',
  external: [
    '@sentry/remix',
    '@sentry/node',
    '@sentry/core',
    '@sentry/bun',
    '@sentry/server-utils',
    '@sentry/opentelemetry',
    '@sentry/server-runtime-injection',
    ...extraExternal,
  ],
  plugins: [sentryBunPlugin()],
});
if (!res.success) {
  console.error(res.logs);
  process.exit(1);
}
console.log('built', entry, '->', outdir);
