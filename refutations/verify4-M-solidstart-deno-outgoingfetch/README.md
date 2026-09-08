# verify4-M-solidstart-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) in SolidStart 2 / nitro 3 node-server output run on Deno 2.9.0** of cell `M-solidstart-deno` (see `$REPRO/cells/M-solidstart-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-node-fix0-static.log`, `appA.pid`, `appB.pid`, `appC.pid`, `appD.pid`, `appE.pid`, `appF.pid`, `build-b.log`, `build-baseline.log`, `build-c.log`, `build-d.log`, `build-e.log`, `build-fix.log`, `build-gated.log`, `build.log`, `deno-base-static.log`, `deno-fix-static.log`, `deno-fix-stream.log`, `deno-gated.log`, `install-vercel-edge.log`, `install.log`, `node-fix-static.log`, `node-gated.log`, `output-baseline/`, `package-lock.json`, `package.json`, `rb-deno-fix0-static-app.log`, `rb-deno-fix0-static-instrument-app.log`, `rb-deno-fix0-static-instrument-rec.log`, `rb-deno-fix0-static-instrument-sink.log`, `rb-deno-fix0-static-rec.log`, `rb-deno-fix0-static-sink.log`, `rb-deno-fix0-stream-app.log`, `rb-deno-fix0-stream-rec.log`, `rb-deno-fix0-stream-sink.log`, `rb-deno-fix1-static-app.log`, `rb-deno-fix1-static-rec.log`, `rb-deno-fix1-static-sink.log`, `rb-deno-fix2-static-app.log`, `rb-deno-fix2-static-rec.log`, `rb-deno-fix2-static-sink.log`, `rb-deno-fix2-stream-app.log`, `rb-deno-fix2-stream-rec.log`, `rb-deno-fix2-stream-sink.log`, `rb-deno-fix3-static-app.log`, `rb-deno-fix3-static-plugin-app.log`, `rb-deno-fix3-static-plugin-rec.log`, `rb-deno-fix3-static-plugin-sink.log`, `rb-deno-fix3-static-rec.log`, `rb-deno-fix3-static-sink.log`, `rb-node-fix0-static-app.log`, `rb-node-fix0-static-rec.log`, `rb-node-fix0-static-sink.log`, `rb-node-fix2-static-app.log`, `rb-node-fix2-static-rec.log`, `rb-node-fix2-static-sink.log`, `rec-node-fix0-static.log`, `rec.pid`, `recorder-b.mjs`, `recorder.log`, `recorder.mjs`, `report-deno-fix0-static.txt`, `report-deno-fix0-stream.txt`, `report-deno-fix1-static.txt`, `report-deno-fix2-static.txt`, `report-deno-fix2-stream.txt`, `report-deno-fix3-static.txt`, `report-deno-instrument-fix0.txt`, `report-final-deno-fix3-static.txt`, `report-node-fix2-static.txt`, `run-b.sh`, `run.sh`, `server/`, `sink-node-fix0-static.log`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced the report exactly, and no supported SolidStart/Nitro wiring knob changes it. The root cause is in @sentry/node: outgoing `fetch` is instrumented only by the vendored undici instrumentation, which listens on `diagnostics_channel` `undici:request:*` (packages/node/src/integrations/node-fetch/undici-instrumentation.ts, `nativeNodeFetchIntegration`). Deno's `fetch` is native Rust, never publishes those channels, so nothing fires — the SDK emits no warning either.

Probe dir: $SCRATCH/deep/verify4-M-solidstart-deno-outgoingfetch (sources: vite.config.ts, server/plugins/sentry.ts, server/fetch-integration.ts, src/routes/api/{fetchout,fetchout-http,sentinel}.ts, recorder-b.mjs, run-b.sh; reports: report-*.txt). Build: `NODE_ENV=production npx vite build`; run: `./run-b.sh <node|deno> <fix 0|1|2|3> <static|stream>` (sink 52141, recorder 52142, app 52143). node_modules was removed after the last build; `.output/` is kept and still runs with `deno run -A .output/server/index.mjs`. Reinstall for a rebuild: `npm install --legacy-peer-deps` with the tarball set from package.json plus $REPRO/_toolbox/pack/sentry-vercel-edge-10.67.0.tgz.

1) NODE control, plugin init, static (report-node-fix0-static via task output):
{"type":"transaction","name":"GET /api/fetchout","op":"http.server",...,"spans":["http.server GET /api/fetchout","middleware GET /api/fetchout","http.server GET /api/fetchout","db mysql2.connect","http.client GET http://127.0.0.1:52142/recorder"]}
recorder: {"url":"/recorder","sentryTrace":"4bf489deb71a459d87f9686275bfaad0-83d59e9e2a9915b6-1","baggage":"yes"}

2) DENO, documented wiring (nitro startup plugin), static — BROKEN, matches the report:
{"type":"transaction","name":"GET /api/fetchout","op":"http.server",...,"spans":["http.server GET /api/fetchout","middleware GET /api/fetchout","http.server GET /api/fetchout","db mysql2.connect"]}
recorder: {"url":"/recorder"}
Same run, `node:http` client on the same Deno process DOES work, which isolates the gap to fetch:
{"type":"transaction","name":"GET /api/fetchout-http",...,"spans":[...,"http.client GET http://127.0.0.1:52142/recorder-http"]}
recorder: {"url":"/recorder-http","sentryTrace":"6fe72f65896b4602b304bae3071039b3-a28c54be4eeec864-1","baggage":"yes"}

3) DENO, stream lifecycle — same gap (fetchout segment has no client span; the node:http route does):
{"type":"span","trace_id":"64d086043f1f4828a89841a82421fe23","items":["middleware GET /api/fetchout","db mysql2.connect","http.server GET","http.server GET","http.server GET"]}
recorder: {"url":"/recorder"}

4) Init placement variant `sentrySolidStart({ autoInjectServerSentry: 'top-level-import', instrumentation: './src/instrument.server.ts' })` — worse, not better: the instrument file is never injected into the nitro 3 output (`grep -rl "init via instrument.server" .output` → nothing; no "@sentry/solidstart" top-level import in the server entry), so Sentry never initializes at all. Sink empty, both routes hit the recorder with no headers:
### sink items (rb-deno-fix0-static-instrument)   <- empty
{"url":"/recorder"}
{"url":"/recorder-http"}
So on SolidStart 2 + nitro 3 the nitro startup plugin is the only init placement that works, and it does not help fetch.

5) Refutations that DO work (userland integration, not a supported knob): both a hand-written integration built from @sentry/core's `addFetchInstrumentationHandler` + `instrumentFetchRequest` (fix=1) and the shipped `winterCGFetchIntegration()` exported by @sentry/vercel-edge (fix=2/3) fully restore the capability on Deno, in both lifecycles:
static, fix=2: {"type":"transaction","name":"GET /api/fetchout",...,"spans":[...,"http.client GET http://127.0.0.1:52142/recorder"]} + {"url":"/recorder","sentryTrace":"2a02828a13234b14ae9b6babaa84f90a-b37c411fcff39f7e-1","baggage":"yes"}
stream, fix=2: {"type":"span","trace_id":"66f7ca9e683c4e02bb0fa3bb8eb96daa","items":["middleware GET /api/fetchout","db mysql2.connect","http.client GET 127.0.0.1",...],"raw":[...{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"9ea50cfc7eaced3e","is_segment":false,"origin":"auto.http.wintercg_fetch"}...]} + {"url":"/recorder","sentryTrace":"66f7ca9e683c4e02bb0fa3bb8eb96daa-b938eae23f289a56-1","baggage":"yes"}
Deno-gated variant (fix=3) verified too: {"url":"/recorder","sentryTrace":"5824e09278f04efaace9dac71b44a9bf-9a0ced3adba59de8-1","baggage":"yes"}.

Important side effect: the same integration must NOT be added unconditionally, because on Node it double-instruments — undici plus winterCG produce two client spans for one request:
{"type":"transaction","name":"GET /api/fetchout",...,"spans":[...,"http.client GET http://127.0.0.1:52142/recorder","http.client GET http://127.0.0.1:52142/recorder"]}

Verdict rationale: with every wiring the SolidStart SDK actually supports (nitro plugin init, both trace lifecycles, the vite plugin's autoInject placement, node-server output), outgoing fetch stays uninstrumented on Deno. This is K2 surfacing through SolidStart unchanged, not a SolidStart-specific defect; it is fixable in the SDK by shipping a fetch instrumentation that patches `globalThis.fetch` when the undici channels are absent.

## Workaround

Add a WinterCG-style global-fetch integration in the nitro startup plugin, gated on Deno so Node does not get duplicate spans. Verified in server/plugins/sentry.ts:

import * as Sentry from '@sentry/solidstart';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';
import { definePlugin } from 'nitro';

export default definePlugin(() => {
  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    integrations: typeof globalThis.Deno !== 'undefined' ? [winterCGFetchIntegration()] : [],
  });
});

(`npm install --legacy-peer-deps @sentry/vercel-edge`, same version as @sentry/solidstart; it bundles cleanly into the nitro node-server output.) If pulling in @sentry/vercel-edge is unwanted, the identical result comes from a ~25 line local integration using `addFetchInstrumentationHandler` + `instrumentFetchRequest` + `shouldPropagateTraceForUrl` from @sentry/core — see server/fetch-integration.ts in the probe dir. Without either, `node:http` / `node:https` clients still produce `http.client` spans with headers on Deno, so switching a critical outbound call off `fetch` is the no-dependency fallback.

## Docs impact

On the SolidStart (and Nitro/Node) guides: "When you run the Node build output on Deno, outgoing `fetch` calls are not instrumented — Sentry's fetch instrumentation relies on Node's undici `diagnostics_channel` events, which Deno's native `fetch` does not emit, so you get no `http.client` span and no `sentry-trace`/`baggage` headers (requests made with `node:http`/`node:https` are unaffected). Until the SDK ships a runtime-agnostic fetch instrumentation, add a global-fetch integration yourself in your Nitro startup plugin, gated on Deno (`typeof globalThis.Deno !== 'undefined' ? [winterCGFetchIntegration()] : []`), because adding it on Node would create duplicate client spans." The SolidStart guide should also state that `sentrySolidStart({ autoInjectServerSentry: 'top-level-import' })` has no effect on SolidStart 2 / Nitro 3 — the instrumentation file is not injected, so `Sentry.init` must be called from a Nitro startup plugin (`server/plugins/sentry.ts`).
