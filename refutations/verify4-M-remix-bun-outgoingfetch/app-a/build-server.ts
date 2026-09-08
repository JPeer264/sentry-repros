import { sentryBunPlugin } from '@sentry/bun/plugin';

const keepRemixExternal = process.env.KEEP_REMIX_EXTERNAL === '1';

const plugins: any[] = [sentryBunPlugin()];

if (keepRemixExternal) {
  // Re-add what sentryBunPlugin's `withoutInstrumentedExternals` stripped, so the CJS
  // `loadModule('@remix-run/server-runtime')` monkeypatch in instrumentServer() still lands.
  plugins.push({
    name: 'keep-remix-external',
    setup(build: any) {
      build.config.external = [
        ...(build.config.external ?? []),
        '@remix-run/server-runtime',
        '@remix-run/node',
        '@remix-run/express',
      ];
    },
  });
}

const out = await Bun.build({
  entrypoints: ['./server.mjs'],
  outdir: process.env.OUTDIR || './dist',
  target: 'bun',
  external: [
    '@sentry/remix',
    '@sentry/node',
    '@sentry/core',
    '@sentry/bun',
    '@sentry/server-utils',
    '@sentry/opentelemetry',
    '@sentry/server-runtime-injection',
  ],
  plugins,
});

if (!out.success) {
  for (const log of out.logs) console.error(log);
  process.exit(1);
}
console.log('[build] ok ->', process.env.OUTDIR || './dist');
