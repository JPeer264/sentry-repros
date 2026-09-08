import { sentryBunPlugin } from '@sentry/bun/plugin';

// Re-externalize what sentryBunPlugin force-un-externalized, so only mysql2 stays bundled and
// transformed. @remix-run/server-runtime must resolve from node_modules for @sentry/remix's
// `instrumentServer()` monkeypatch (per-request isolation + continueTrace) to land on the copy the
// app actually calls.
const keepExternal = (names: string[]) => ({
  name: 'keep-external',
  setup(build: any) {
    build.config.external = [...(build.config.external ?? []), ...names];
  },
});

const out = await Bun.build({
  entrypoints: ['./server.mjs'], outdir: './dist-c', target: 'bun',
  external: ['@sentry/remix','@sentry/node','@sentry/core','@sentry/bun','@sentry/server-utils','@sentry/opentelemetry','@sentry/server-runtime-injection'],
  plugins: [sentryBunPlugin(), keepExternal(['express','@remix-run/express','@remix-run/node','@remix-run/server-runtime','@remix-run/react'])],
});
console.log('build-c success:', out.success, out.logs.slice(0,10));
