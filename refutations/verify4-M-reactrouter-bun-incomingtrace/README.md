# verify4-M-reactrouter-bun-incomingtrace

## What it re-tests

Independent re-test of the capability **incoming trace (React Router 8 framework mode, custom Express/Node server, @sentry/react-router 10.67.0 develop, bun 1.4.0)** of cell `M-reactrouter-bun` (see `$REPRO/cells/M-reactrouter-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `app5.pid`, `app6.pid`, `app7.pid`, `app8.pid`, `build2.log`, `build3.log`, `chantest.mjs`, `dc-probe.mjs`, `instrument.baseline.mjs`, `run-baseline.log`, `run-fix.log`, `run-plain.log`, `run-stream.log`, `scaffold.log`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sink2.pid`, `v2-baseline.log`, `v2-fix.log`, `v3-fix.log`, `v4-stream-1314.log`, `v5-stream.log`, `v6-noinstr-fix.log`, `v7-noinstr-base.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The capability works once one integration is added to `Sentry.init()`.

Root cause of the original finding: trace continuation for incoming requests lives in core's `instrumentServer()` (packages/core/src/integrations/http/server-subscription.ts:174-215), which clones the isolation scope and calls `continueTrace({ sentryTrace, baggage })` around the server's `emit('request')`. On Node that function is reached through the `http.server.request.start` diagnostics channel, subscribed by `httpServerIntegration` (packages/node/src/integrations/http/httpServerIntegration.ts:145-147). Bun never publishes that channel, and it is NOT a native Node channel either, so nothing feeds the server in. Confirmed empirically:

  $ bun chantest.mjs   # subscribe to http.server.request.start + fire a node:http request
  CHANNELS_FIRED=[]
  $ node chantest.mjs
  CHANNELS_FIRED=[]

The SDK already ships the Bun-side bridge: `bunHttpServerIntegration()` (packages/bun/src/integrations/bunHttpServer.ts) patches `http.Server.prototype.emit` and hands each server to the very same `getHttpServerSubscriptions` → `instrumentServer` path. It is a DEFAULT integration of `@sentry/bun`'s own `init()` (packages/bun/src/sdk.ts:72), but `@sentry/react-router` inits through `@sentry/node`'s defaults, so on Bun it is simply absent.

BASELINE (reproduces the report exactly) — `instrument.server.mjs` with the stock `Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static' })`, request to `/users/1?mode=error` carrying `sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1` + matching baggage, then `/flush`:

  {"type":"event","exception":"Error: loader boom on bun","transaction":"GET /users/:id","trace_id":"0671c2fefd714012926c8459b88db3f9","parent_span_id":"818e49cea0649f2b","dsc_trace_id":"0671c2fefd714012926c8459b88db3f9"}
  {"type":"transaction","name":"GET /users/:id","trace_id":"0671c2fefd714012926c8459b88db3f9"}          <- no parent_span_id at all
  {"type":"event","message":"sentinel","transaction":"GET /flush","trace_id":"0671c2fefd714012926c8459b88db3f9"}   <- same process-wide trace, no isolation

AFTER adding the integration (the ONLY change; nothing else touched):

  import * as Sentry from '@sentry/react-router';
  import { bunHttpServerIntegration } from '@sentry/bun';
  Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static',
                integrations: [bunHttpServerIntegration()] });

Same two requests:

  {"type":"event","exception":"Error: loader boom on bun","transaction":"GET /users/:id","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","span_id":"8bdb7086bcb60330","parent_span_id":"85ceb6a4360ac28b","dsc_trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","dsc_sampled":"true","user":{"ip_address":"::ffff:127.0.0.1"},"request":{"url":"http://127.0.0.1:47313/users/1?mode=error","method":"GET","headers":{"sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1","baggage":"..."}}}
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"internal_error","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["function /users/:id"]}
  {"type":"event","message":"sentinel","transaction":"GET /flush","trace_id":"8d1ca89e0e5e42389749a0ff61121f40"}   <- separate trace: isolation restored

So: trace_id == the incoming aaaa… id, the segment's parent_span_id == the incoming bbbbbbbbbbbbbbbb, DSC propagated, request/IP data attached, and per-request isolation works. Three bonus effects fall out of the same change: request isolation, `request` data on events, and an `http.server` root span.

Also verified with the DEVELOP DEFAULT lifecycle `traceLifecycle: 'stream'` (span envelopes):

  {"type":"span","trace_id":"eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee","items":["function /users/:id","http.server GET /users/:id"],
   "raw":[{"name":"/users/:id","status":"error","parent_span_id":"866761be6b58c7bf","is_segment":false,"origin":"auto.function.react_router.instrumentation_api"},
          {"name":"GET /users/:id","status":"error","parent_span_id":"2222222222222222","is_segment":true,"origin":"auto.http.react_router.instrumentation_api"}]}

and the error event on that request carried trace_id `eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`.

Independence check — the fix is NOT an artifact of React Router 8's instrumentation API (`Sentry.createSentryServerInstrumentation()`). A plain Express route registered in `server.js` that never reaches the React Router handler continues the trace too, and two different incoming traces stay separate:

  event Error: plain express boom trace= cccccccccccccccccccccccccccccccc parent= 1111111111111111
  transaction GET /plain           trace= cccccccccccccccccccccccccccccccc parent= 1111111111111111
  event Error: plain express boom trace= dddddddddddddddddddddddddddddddd parent= 1111111111111111
  transaction GET /plain           trace= dddddddddddddddddddddddddddddddd parent= 1111111111111111
  event sentinel                   trace= 2bd7655b22e14a0f9be917010461eb04

Notes / caveats:
- `@sentry/bun` must be installed alongside `@sentry/react-router` and must dedupe to ONE `@sentry/core@10.67.0` (verified: only `node_modules/@sentry/core` exists, no nested copy). Installed with `npm install $S/pack/sentry-bun-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz`.
- The debug warning "No diagnostics-channel injection detected. Channel-based integrations will not record spans." is still printed and is still accurate for *library* spans (express/db/AI) — those remain absent without a Bun bundle. It is misleading here in that incoming-request tracing is fully fixed while the warning still fires.
- The Bun workaround the original probe found is still required: `app/entry.server.tsx` must use `renderToReadableStream`, because Bun resolves `react-dom/server` to `server.bun.js` which has no `renderToPipeableStream`. That means `Sentry.createSentryHandleRequest(...)` (the wiring the docs and the `react-router-8-framework` e2e app show) is unusable on Bun; `Sentry.wrapSentryHandleRequest(handler)` is.
- bun 1.3.14 (the CI pin) could NOT be cross-checked: `$S/bun1314` no longer exists on this machine. Only bun 1.4.0 was tested.
- The repo's own reference app `~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/react-router-8-framework` runs Node with `NODE_OPTIONS='--import ./instrument.mjs'`, which is exactly the mechanism Bun lacks.

Probe files (all absolute, rerunnable):
  $SCRATCH/deep/verify4-M-reactrouter-bun-incomingtrace/
    sink.mjs                    envelope sink extended with span_id/parent_span_id/dsc_trace_id/dsc_sampled on events
    chantest.mjs                proves http.server.request.start never fires on bun 1.4.0 (nor plain node)
    instrument.baseline.mjs     the failing init (no integration)
    app/instrument.server.mjs   the fixed init (bunHttpServerIntegration, toggle off with BUN_HTTP=0)
    app/server.js               Express 5 server, `import "./instrument.server.mjs"` first line, extra /plain route, setupExpressErrorHandler
    app/app/entry.server.tsx    renderToReadableStream + wrapSentryHandleRequest + createSentryHandleError + createSentryServerInstrumentation
    app/app/routes/users.tsx    /users/:id?mode=error ; app/app/routes/flush.tsx sentinel+flush
    run-baseline.log run-fix.log run-plain.log run-stream.log sink.log

Rerun:
  PORT=47311 node sink.mjs > sink.log 2>&1 &
  (cd app && PORT=47313 bun server.js &)
  curl -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' 'http://127.0.0.1:47313/users/1?mode=error'
  curl http://127.0.0.1:47313/flush ; curl -s http://127.0.0.1:47311/__items

## Workaround

Install `@sentry/bun` next to `@sentry/react-router` (same version, deduped to one `@sentry/core`) and add its `bunHttpServerIntegration()` to the server-side `Sentry.init()`:

```js
// instrument.server.mjs — imported as the very first line of server.js
import * as Sentry from '@sentry/react-router';
import { bunHttpServerIntegration } from '@sentry/bun';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [bunHttpServerIntegration()],
});
```

That single line restores incoming trace continuation (trace_id + parent_span_id from `sentry-trace`/`baggage`), per-request isolation scopes, request/IP data on events, and an `http.server` root span, under both `traceLifecycle: 'static'` and the default `'stream'`. It works for plain Express routes too, so it does not depend on React Router's instrumentation API. It does NOT bring back library spans (express layers, db, AI) — those still need a Bun bundle built with `sentryBunPlugin()`.

A better long-term fix inside the SDK would be for `@sentry/node`'s `httpServerIntegration` (or the framework SDKs built on it) to fall back to the `http.Server.prototype.emit` patch when `process.versions.bun` is set, so no extra package and no extra integration are needed.

## Docs impact

On the React Router (and any `@sentry/node`-based framework) guide, add a Bun section: "When you run the server with `bun` instead of `node`, Bun does not emit the `http.server.request.start` diagnostics channel the Node SDK relies on, so incoming requests get no isolation scope and no trace continuation from `sentry-trace`/`baggage` headers. Install `@sentry/bun` at the same version and add `integrations: [bunHttpServerIntegration()]` to your server-side `Sentry.init()`. Note also that Bun resolves `react-dom/server` to a build without `renderToPipeableStream`, so use `renderToReadableStream` in `app/entry.server.tsx` and wrap it with `Sentry.wrapSentryHandleRequest()` rather than `Sentry.createSentryHandleRequest()`."
