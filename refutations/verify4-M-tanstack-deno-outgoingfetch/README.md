# verify4-M-tanstack-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-tanstack-deno` (see `$REPRO/cells/M-tanstack-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `.gitignore`, `app-deno-base.log`, `app-deno-fetchfix-static.log`, `app-deno-fetchfix-stream.log`, `app-deno-stream.log`, `app-node.log`, `appdeno.pid`, `appdeno2.pid`, `appdeno3.pid`, `appdeno4.pid`, `appnode.pid`, `build1.log`, `build2.log`, `dc-probe.mjs`, `deno-entry.mjs`, `docker-compose.yml`, `global-setup.mjs`, `global-teardown.mjs`, `install1.log`, `install2.log`, `instrument.server.mjs`, `package-lock.json`, `package.json`, `playwright.config.mjs`, `rec.log`, `rec.pid`, `recorder.mjs`, `run2-app-cffix.log`, `run2-app-denobase.log`, `run2-app-denobasestream.log`, `run2-app-fetchfixstatic.log`, `run2-app-fetchfixstatic2.log`, `run2-app-fetchfixstream.log`, `run2-app-nodectl.log`, `run2-rec.log`, `run2-rec.pid`, `run2-sink.log`, `run2-sink.pid`, `run2.sh`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`, `start-event-proxy.mjs`, `tests/`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced the report from a clean build and could not refute it with any supported wiring. A userland integration does fix it, so the defect is a missing shipped integration, not a Deno limitation.

Probe dir: $SCRATCH/deep/verify4-M-tanstack-deno-outgoingfetch/ (app node_modules removed after the run; .output/server is kept and is self-contained, so the deno runs below rerun without reinstalling).

Setup (identical to the repo e2e app dev-packages/e2e-tests/test-applications/tanstackstart-react, whose src/, vite.config.ts, tsconfig*.json I copied verbatim; only the two db routes were stubbed out and api.fetchout.ts / api.sentinel.ts added):
  npm install --no-audit --no-fund $REPRO/_toolbox/pack/sentry-{tanstackstart-react,node,core,server-utils,server-runtime-injection,opentelemetry,browser,react,browser-utils,replay,replay-canvas,feedback,bundler-plugins}-10.67.0.tgz
  npm install --no-audit --no-fund nitro@latest
  node node_modules/esbuild/install.js && node node_modules/@swc/core/postinstall.js
  npx vite build
sink.mjs on 43117 (tunnel), recorder.mjs on 43119, app on 43121.

I independently hit the build failure the first agent reported, so it is real and reproducible, not an artifact of their config. With the plain documented vite.config.ts (tsConfigPaths, tanstackStart, nitro, viteReact, sentryTanstackStart) `vite build` dies in rollup (build1.log):
  error during build: Cannot read properties of null (reading 'getVariableForExportName')
      at getVariableForExportNameRecursive (node_modules/rollup/dist/es/shared/node-entry.js:17045:19)
My own pre-plugin (vite.config.ts, `sentryExternalShim`) that keeps every `@sentry/*` specifier external in non-client environments behind a `import * as ns from '<pkg>'; export * from '<pkg>'; export default ns;` shim makes the build pass. This is a node/vite/rollup problem, not Deno.

CONTROL, same .output under node v26.5.0 (`node --import ./instrument.server.mjs index.mjs`, app-node.log) — works:
  {"type":"transaction","name":"GET /api/fetchout","op":"http.server","source":"url","status":"ok","trace_id":"9b7e0f1801b24ff898f7a41bfebd970a","spans":["middleware globalRequestMiddleware","http.client GET http://127.0.0.1:43119/rec"]}
  recorder: {"url":"/rec","sentryTrace":"9b7e0f1801b24ff898f7a41bfebd970a-a21d8cb876a92bce-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=9b7e0f1801b24ff898f7a41bfebd970a,sentry-sampled=true,..."}

BASELINE, deno 2.9.0, `PORT=43121 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi deno-entry.mjs` (deno-entry.mjs = `import './instrument.server.mjs'; import './index.mjs';`), traceLifecycle 'static' (app-deno-base.log) — broken:
  {"type":"transaction","name":"GET /api/fetchout","op":"http.server","source":"url","status":"ok","trace_id":"1ea46c9ed6d54b7184dcd122d8844721","spans":["middleware globalRequestMiddleware"]}
  recorder: {"url":"/rec","sentryTrace":null,"baggage":null}
The server span, the tanstackstart middleware span and the sentinel event all arrive, so init and the transport are fine; only the http.client span and the propagation headers are missing.

VARIANT traceLifecycle 'stream' on Deno (app-deno-stream.log) — same, still no client span:
  {"type":"span","trace_id":"9503c55d086c41848d124513ace7543f","items":["middleware globalRequestMiddleware","http.server GET"]}

Root cause, read from the source: packages/node/src/integrations/node-fetch/index.ts calls `instrumentUndici()`, and packages/node/src/integrations/node-fetch/undici-instrumentation.ts is a vendored @opentelemetry/instrumentation-undici that only subscribes to the `undici:request:*` diagnostics channels. Deno's `fetch` is the native Rust implementation and never publishes those channels, so nothing fires. No init option, entry shape, trace lifecycle or Deno flag can change that — there is no other hook point in the node SDK for the global `fetch`.

REFUTED PARTIALLY by a userland integration (not shipped, not documented): re-implementing @sentry/cloudflare's `fetchIntegration` on top of primitives @sentry/core already exports (`addFetchInstrumentationHandler` + `instrumentFetchRequest`, which patch `globalThis.fetch`) restores both the span and the headers on Deno. Files: .output/server/deno-fetch-integration.mjs, .output/server/instrument.fetchfix.mjs, .output/server/deno-entry-fetchfix.mjs.
  static (app-deno-fetchfix-static.log):
    {"type":"transaction","name":"GET /api/fetchout","op":"http.server","status":"ok","trace_id":"f8e0a54e7ea44c5280007ab146b580e2","spans":["middleware globalRequestMiddleware","http.client GET http://127.0.0.1:43119/rec"]}
    recorder: {"url":"/rec","sentryTrace":"f8e0a54e7ea44c5280007ab146b580e2-b591d3b9aa05a293-1","baggage":"...sentry-trace_id=f8e0a54e7ea44c5280007ab146b580e2,sentry-sampled=true..."}
  stream (app-deno-fetchfix-stream.log):
    {"type":"span","trace_id":"7e4595f5e1b6420f978fec414a3a6d14","items":["middleware globalRequestMiddleware","http.client GET 127.0.0.1","http.server GET"],"raw":[...{"name":"GET 127.0.0.1","parent_span_id":"8e01428cf66907ce","origin":"auto.http.fetch"}...]}
The client span is correctly parented under the server segment and carries the same trace id, so the OTel context propagation into `startInactiveSpan` works on Deno; only the channel-based trigger is missing.

TanStack Start is not implicated anywhere: the framework's own request/function middleware spans and route handling behave the same on both runtimes.

Rerun: `cd <probe>/.output/server && PORT=43121 RECORDER_URL=http://127.0.0.1:43119/rec deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi deno-entry.mjs` (broken) vs `... deno-entry-fetchfix.mjs` (works), with `PORT=43117 node ../../sink.mjs` and `PORT=43119 node ../../recorder.mjs` running.

## Workaround

Add a global-fetch integration in instrument.server.mjs, built from primitives @sentry/core already exports (this is a copy of @sentry/cloudflare's shipped `fetchIntegration`):

  import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl } from '@sentry/core';
  const denoFetchIntegration = defineIntegration(() => {
    const headersUrlMap = new LRUMap(100);
    const spans = {};
    return { name: 'DenoGlobalFetch', setupOnce() {
      addFetchInstrumentationHandler(handlerData => {
        const client = getClient();
        if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
        instrumentFetchRequest(handlerData, () => true,
          url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
          spans, { spanOrigin: 'auto.http.fetch' });
      });
    }};
  });
  Sentry.init({ dsn, tunnel, tracesSampleRate: 1, integrations: [denoFetchIntegration()] });

Verified on Deno with both traceLifecycle 'static' and 'stream'. The proper SDK fix is for @sentry/node to fall back to this globalThis.fetch patching when the undici diagnostics channels never fire (non-undici runtimes: Deno, and Bun's native fetch), rather than leaving it to userland.

Separately, building this app at all needs a vite pre-plugin that externalizes `@sentry/*` in the non-client environments and gives each one a default export; without it `vite build` fails in rollup with "Cannot read properties of null (reading 'getVariableForExportName')" on node too. Full file at <probe>/vite.config.ts.

## Docs impact

The TanStack Start guide has no Deno page at all (~/dev/sentry-docs/docs/platforms/javascript/guides/tanstackstart-react/ contains no mention of "deno"); if one is added it must say: on Deno the server SDK does not instrument outgoing `fetch()` — no `http.client` span is created and no `sentry-trace`/`baggage` headers are attached — because the instrumentation listens on undici's `diagnostics_channel` events, which Deno's native fetch does not emit; use `node:http`/`node:https` or wrap the call in `Sentry.startSpan()` until the SDK ships a global-fetch fallback.
