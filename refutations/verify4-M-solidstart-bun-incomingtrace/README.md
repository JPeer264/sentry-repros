# verify4-M-solidstart-bun-incomingtrace

## What it re-tests

Independent re-test of the capability **incoming trace (SolidStart 2 + nitro node output on bun 1.4.0, develop SDK 10.67.0)** of cell `M-solidstart-bun` (see `$REPRO/cells/M-solidstart-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `app5.pid`, `build-bunpreset.log`, `build-node.log`, `build-node2.log`, `build.log`, `build2.log`, `dc-probe.mjs`, `install.log`, `install2.log`, `log-base-bun.txt`, `log-base-node.txt`, `log-bunpreset-bunserve.txt`, `log-bunpreset.txt`, `log-nodepreset-bunhttp-spans.txt`, `log-nodepreset-bunhttp.txt`, `log-stream-bunhttp.txt`, `probe.sh`, `run-base-bun.log`, `run-bunhttp-spans.log`, `run-bunhttp-stream.log`, `run-bunhttp.log`, `run-node.log`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The reported diagnosis is right about the mechanism but wrong that nothing can fix it: the SDK already ships the fix, `bunHttpServerIntegration()` from `@sentry/bun`, and adding it to the existing `Sentry.init()` restores incoming-trace continuation (and per-request isolation) to full node parity, with no change to the build, the preset, or the entry shape.

ROOT CAUSE, isolated (probe $SCRATCH/deep/verify4-M-solidstart-bun-incomingtrace/dc-probe.mjs):
  node dc-probe.mjs -> {"runtime":"node","hits":["start:/probe","finish"],"hasTracingChannel":true}
  bun  dc-probe.mjs -> {"runtime":"bun","hits":[],"hasTracingChannel":true}
Bun 1.4.0's `node:http` never publishes the `http.server.request.start` diagnostics channel that `@sentry/node`'s `httpServerIntegration` subscribes to (packages/core/src/integrations/http/constants.ts:3, packages/node/src/integrations/http/httpServerIntegration.ts `wrapServerEmitRequest`, which is where `propagation.extract` + the isolation scope happen). It is the node:http path that matters here, not Bun.serve: the nitro `node-server` preset resolves `srvx` through the `node` export condition at build time, so `.output/server/_libs/srvx.mjs` starts with `import "node:http"` and contains zero `Bun.serve` references even when run under bun. The nitro srvx/h3 tracing channels (packages/nitro/src/runtime/hooks/captureTracingEvents.ts) really do only `startInactiveSpan`, so with no continuation upstream every request lands on the process-global propagation context.

A. BASELINE, docs-shaped wiring, `bun .output/server/index.mjs` — broken, reproduces the report:
  {"activeTraceId":"19e8973040fe45ae95550b998fd043f4","rootTraceId":"19e8973040fe45ae95550b998fd043f4","rootParentSpanId":null,...}   <- request WITH sentry-trace 12345678901234567890123456789012-1234567890abcdef-1
  {"activeTraceId":"19e8973040fe45ae95550b998fd043f4",...}                                                                            <- request WITHOUT headers, same trace id
  {"type":"transaction","name":"GET /api/hello","op":"http.server","source":"url","status":"ok","trace_id":"19e8973040fe45ae95550b998fd043f4","sdk":"sentry.javascript.solidstart","spans":["middleware GET /api/hello","http.server GET /api/hello"],"hasRequestData":false}
  (all three transactions + the sentinel event share 19e897…, none has parent_span_id, no request data)

B. NODE CONTROL, same build, `node .output/server/index.mjs` — works:
  {"type":"transaction","name":"GET /api/hello",...,"trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890abcdef","spans":["http.server GET /api/hello","middleware GET /api/hello","http.server GET /api/hello"]}

C. FIX — same node-server build, same `bun .output/server/index.mjs`, only `integrations: [bunHttpServerIntegration()]` added to the nitro plugin's `Sentry.init()`:
  {"activeTraceId":"12345678901234567890123456789012","rootTraceId":"12345678901234567890123456789012","rootParentSpanId":"1234567890abcdef",...}
  {"activeTraceId":"67d2da44e2614a79bcdac051ee6fbb86",...}   <- unheadered request gets its own trace, isolation restored
  {"type":"transaction","name":"GET /api/hello","op":"http.server","source":"url","status":"ok","trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890abcdef","sdk":"sentry.javascript.solidstart","spans":["http.server GET /api/hello","middleware GET /api/hello","http.server GET /api/hello"],"hasRequestData":false}
  {"type":"event","message":"sentinel",...,"transaction":"GET /api/sentinel","trace_id":"81934bfcacab4cb0a75d0ce6c0f9c39a","user":{"ip_address":"127.0.0.1"},"request":{"url":"http://127.0.0.1:47317/api/sentinel","method":"GET",...}}
  Span tree, transaction naming, request data and user ip are byte-for-byte the same shape as the node control (B).

D. FIX under `traceLifecycle: 'stream'` — also works; the segment span carries the incoming parent:
  {"type":"span","trace_id":"12345678901234567890123456789012","items":["middleware GET /api/hello","http.server GET","http.server GET","http.server GET"],"raw":[...,{"name":"GET","status":"ok","parent_span_id":"1234567890abcdef","is_segment":true,"origin":"auto.http.server"}]}

E. `bunHttpServerIntegration({ spans: false })` — also continues the trace and isolates, but drops the node:http server span, leaving only the two nitro channel spans. Prefer the default (`spans: true`), which matches node exactly.

F. Alternative that also works but is worse: build with the nitro `bun` preset (`NITRO_PRESET=bun npx vite build`, which flips srvx to its `Bun.serve` adapter) plus `bunServerIntegration()` from `@sentry/bun`. Trace continuation works (`"trace_id":"12345678901234567890123456789012","parent_span_id":"1234567890abcdef"`), but the extra root span is unparameterized (`spans:["http.server GET /","middleware GET /api/hello","http.server GET /api/hello"]`) and the bun preset alone, without the integration, is still broken (all requests on 8cbbbda65e2a4f479e36538da34c8de3, transaction names collapse to "GET /"). Do not recommend this path.

Probe files: $SCRATCH/deep/verify4-M-solidstart-bun-incomingtrace/ — app/ (vite.config.ts, server/plugins/sentry.ts with a PROBE_INT switch, src/middleware.ts, src/routes/api/hello.ts returning the live trace ids, src/routes/api/sentinel.ts), probe.sh (starts the server, sends one headered + one unheadered request, sends the sentinel, waits for it in the sink, dumps items), dc-probe.mjs, log-*.txt.
Rerun: `cd app && npm install --legacy-peer-deps && npx vite build` (node_modules was removed after the run; `.output` is current and self-contained), then `PORT=47311 node $REPRO/_toolbox/sink.mjs &` and `SINK_PORT=47311 APP_PORT=47316 ./probe.sh <label> env PROBE_INT=bunhttp-spans bun .output/server/index.mjs`. PROBE_INT values: unset (baseline), bunhttp (`{spans:false}`), bunhttp-spans (default), bunserve. SENTRY_LIFECYCLE=stream switches lifecycle.
No SolidStart or bun page in ~/dev/sentry-docs mentions `bunHttpServerIntegration`; grep over docs/platforms/javascript/guides/solidstart/ and platform-includes finds no occurrence, and no bun mention at all in the SolidStart guide.

## Workaround

Add `@sentry/bun` as a dependency and pass its `bunHttpServerIntegration()` to the existing `Sentry.init()` in `server/plugins/sentry.ts`. Nothing else changes — same `vite build`, same nitro node output, same `bun .output/server/index.mjs`:

  import { bunHttpServerIntegration } from '@sentry/bun';
  import * as Sentry from '@sentry/solidstart';
  import { definePlugin } from 'nitro';

  export default definePlugin(() => {
    Sentry.init({
      dsn: '…',
      tracesSampleRate: 1.0,
      integrations: [bunHttpServerIntegration()],
    });
  });

The integration self-disables on Node (`if (!process.versions.bun) return`), so the same source builds and runs unchanged under `node .output/server/index.mjs` — verified in run B, where the import was present. Cost: `@sentry/bun` adds roughly 2.4 MB to the server bundle.

## Docs impact

On Bun, add `bunHttpServerIntegration()` from `@sentry/bun` to your `Sentry.init()` in `server/plugins/sentry.ts`: Bun's `node:http` does not emit the `http.server.request.start` diagnostics channel the Node SDK relies on, so without it every request shares one process-global trace, incoming `sentry-trace`/`baggage` headers are ignored, and no request data is attached; the integration is a no-op under Node, so the same file works for both runtimes.
