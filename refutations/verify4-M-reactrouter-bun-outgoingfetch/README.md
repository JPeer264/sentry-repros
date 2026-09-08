# verify4-M-reactrouter-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (React Router 8 framework mode, custom Express server, @sentry/react-router 10.67.0 develop, bun 1.4.0)** of cell `M-reactrouter-bun` (see `$REPRO/cells/M-reactrouter-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO.md`, `app/`, `app-baseline.log`, `app-bunall-static.log`, `app-bunall-stream-b1314.log`, `app-bunall-stream.log`, `app-bunfetch-stream.log`, `app-bunfetch.log`, `items-baseline-static.json`, `items-bunall-static.json`, `items-bunall-stream.json`, `items-bunfetch-static.json`, `items-bunfetch-stream.json`, `items-node-bunfetch-stream.json`, `pids.txt`, `pidsb.txt`, `rec.log`, `recb.log`, `recc.log`, `run-b.sh`, `runb-baseline-static.log`, `runb-bunall-static.log`, `runb-bunall-stream.log`, `runb-bunfetch-static.log`, `runb-bunfetch-stream.log`, `runb-node-bunfetch-stream.log`, `sink.log`, `sinkb.log`, `sinkc.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The default `@sentry/react-router` init on Bun really does nothing for outgoing fetch (the report is right about the default), but one added integration fixes it completely, no bundler and no code change in the loader.

EXACT CHANGE, in `instrument.server.mjs`:

  import * as Sentry from "@sentry/react-router";
  import { fetchIntegration, bunHttpServerIntegration } from "@sentry/bun";

  Sentry.init({
    dsn, tunnel, tracesSampleRate: 1.0,
    integrations: process.versions.bun ? [fetchIntegration(), bunHttpServerIntegration()] : [],
  });

plus `@sentry/bun@10.67.0` in the install line (`$REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz`). `fetchIntegration()` alone is enough for the capability under test; `bunHttpServerIntegration()` additionally supplies the incoming-request span and per-request isolation that the report also found missing.

Why the default fails: `nativeNodeFetchIntegration` (packages/node/src/integrations/node-fetch/index.ts) calls `instrumentUndici()`, which is undici-diagnostics-channel based; Bun implements no such channel, hence the `No available Node API to register diagnostics-channel injection hooks` warning. `@sentry/bun`'s `fetchIntegration` (packages/bun/src/integrations/fetch.ts) instead wraps global `fetch` via core's `addFetchInstrumentationHandler` + `instrumentFetchRequest`, which works on Bun. It is a plain `defineIntegration` over `@sentry/core` primitives, so it composes with a `@sentry/react-router` client with no dual-core problem (npm dedupes both to one `@sentry/core` 10.67.0).

EVIDENCE (my rerun, sink on 51431, recorder on 51432, app on 51433, `bun 1.4.0 server.js`).

1. baseline (report's setup), static — no span, no headers:
  items: [{"type":"event","message":"sentinel",...}]
  REC /rec {"connection":"keep-alive","user-agent":"Bun/1.4.0","accept":"*/*","host":"127.0.0.1:51432","accept-encoding":"gzip, deflate, br, zstd"}

2. + fetchIntegration(), traceLifecycle 'stream' — span AND headers:
  items: [{"type":"span","trace_id":"8fb773dbbd4d450d9532a39ffbe6fe54","items":["http.client GET 127.0.0.1"],"raw":[{"name":"GET 127.0.0.1","status":"ok","is_segment":true,"origin":"auto.http.fetch"}]}, {"type":"event","message":"sentinel",...}]
  REC /rec {"baggage":"sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=8fb773dbbd4d450d9532a39ffbe6fe54,sentry-transaction=GET%20127.0.0.1,sentry-sampled=true,sentry-sample_rand=0.478...,sentry-sample_rate=1","sentry-trace":"8fb773dbbd4d450d9532a39ffbe6fe54-a409a1f092ee2976-1",...}

3. + fetchIntegration() + bunHttpServerIntegration(), 'stream' — client span parented under the route-named server span, and per-request isolation (sentinel gets its own trace + `transaction: GET /flush` + request data):
  [{"type":"span","trace_id":"927da38c3b154c39938da5073bab6cda","items":["http.client GET 127.0.0.1","http.server GET /fetchout"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"80f9adff73b09c45","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET /fetchout","status":"ok","is_segment":true,"origin":"auto.http.react_router.request_handler"}]},{"type":"event","message":"sentinel",...,"transaction":"GET /flush","trace_id":"51f55bc88fc9478e894d3313e965aab3","user":{"ip_address":"::ffff:127.0.0.1"},"request":{"url":"http://127.0.0.1:51433/flush",...}}]

4. Same, traceLifecycle 'static' — a normal transaction with the fetch as a child:
  [{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"c64e46c5090e46f985e09469d02f9734","sdk":"sentry.javascript.react-router","spans":["http.client GET http://127.0.0.1:51432/rec"]}, ..., {"type":"transaction","name":"GET /flush",...,"spans":[]}]

TRACE-LIFECYCLE CAVEAT: with `fetchIntegration()` but WITHOUT `bunHttpServerIntegration()`, `traceLifecycle: 'static'` still sends the headers but delivers no span envelope, only a `client_report` (a standalone `http.client` root span is dropped in the static lifecycle):
  items-bunfetch-static: [{"type":"client_report"},{"type":"event","message":"sentinel",...}]
  REC /rec {"baggage":"...sentry-trace_id=4c58fd9d1c2442a186a1d0ed1f0c597c","sentry-trace":"4c58fd9d1c2442a186a1d0ed1f0c597c-9fb6339912a064e5",...}
So on Bun with the static lifecycle you need both integrations, or the stream default.

NODE CAVEAT (why the gate matters): running the identical build under `node` with `fetchIntegration()` unconditionally produces TWO client spans for one fetch:
  {"name":"GET 127.0.0.1",...,"origin":"auto.http.node_fetch"},{"name":"GET 127.0.0.1",...,"origin":"auto.http.fetch"}
Hence `process.versions.bun ? [...] : []`, or `nativeNodeFetchIntegration` disabled.

The report's other environmental claims all reproduce and are not disputed: the stock `entry.server.tsx` must be rewritten to `renderToReadableStream` on Bun, so `createSentryHandleRequest` (the wiring in the repo's own e2e app, dev-packages/e2e-tests/test-applications/react-router-8-framework, and in the docs) is unusable there; `wrapSentryHandleRequest` + `createSentryHandleError` is the only server-entry shape that works.

NOT RUN: the bun 1.3.14 cross-check — `$SCRATCH/bun1314/bun-darwin-aarch64/bun` no longer exists on this machine.

Probe dir: $SCRATCH/deep/verify4-M-reactrouter-bun-outgoingfetch/ — `app/instrument.server.mjs` (PROBE_VARIANT=baseline|bunfetch|bunall, PROBE_LIFECYCLE=static|stream), `app/app/routes/fetchout.tsx`, `app/app/routes/flush.tsx`, `app/app/entry.server.tsx`, `app/recorder.mjs`, `run-b.sh` (one variant per invocation), `items-*.json`, `recb.log`/`recc.log`, `REPRO.md`. Rerun: start `PORT=51431 node $REPRO/_toolbox/sink.mjs` and `REC_PORT=51432 node app/recorder.mjs`, then `zsh run-b.sh bunall stream bunall-stream`.

## Workaround

Install `@sentry/bun` alongside `@sentry/react-router` and add its integrations in `instrument.server.mjs`, gated on Bun: `integrations: process.versions.bun ? [fetchIntegration(), bunHttpServerIntegration()] : []` (both imported from `@sentry/bun`). `fetchIntegration()` restores `http.client` spans and `sentry-trace`/`baggage` on outgoing `fetch`; `bunHttpServerIntegration()` adds the `http.server GET /route` parent span and per-request isolation. The gate is required because on Node the Bun fetch integration duplicates every client span with `nativeNodeFetchIntegration`. No bundler step, no loader change, no `--import` hook needed.

## Docs impact

On the React Router (and any `@sentry/node`-based framework SDK) guide: "Running the server on Bun: `@sentry/node`'s fetch, HTTP-server and library instrumentation is diagnostics-channel based and does not fire on Bun. Install `@sentry/bun` next to the framework SDK and add its Bun integrations from your server init, gated on the runtime so Node builds are unaffected — `integrations: process.versions.bun ? [fetchIntegration(), bunHttpServerIntegration()] : []` — to get `http.client` spans and `sentry-trace`/`baggage` on outgoing `fetch`, incoming-request spans, and per-request isolation. On Bun you must also replace the template's `renderToPipeableStream` server entry with `renderToReadableStream`, which means `Sentry.createSentryHandleRequest()` cannot be used; wrap your own handler with `Sentry.wrapSentryHandleRequest()` instead."
