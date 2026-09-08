# verify4-M-solidstart-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) in SolidStart 2 on bun** of cell `M-solidstart-bun` (see `$REPRO/cells/M-solidstart-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-bun-base.log`, `app-bun-bunfetch-stream.log`, `app-bun-bunfetch.log`, `app-bun-globalfetch.log`, `app-final-bun.log`, `app-final-bun1314.log`, `app-final-node.log`, `app-node-base.log`, `app-node-bunfetch.log`, `app-postclean.log`, `app.pid`, `apppid.txt`, `build-a.log`, `build-b.log`, `build-f.log`, `build1.log`, `build2.log`, `build3.log`, `drive.sh`, `install.log`, `npm-install-bun.log`, `npm-install.log`, `pids.txt`, `rawpid.txt`, `rawsink.log`, `rawsink.mjs`, `run-bun-a.log`, `run-bun-b.log`, `run-bun-baseline.log`, `run-bun-bunfetch-stream.log`, `run-bun-bunfetch.log`, `run-bun-c.log`, `run-bun-d.log`, `run-bun-e.log`, `run-bun-globalfetch.log`, `run-f-bun.log`, `run-f-node.log`, `run-final-bun.log`, `run-final-bun1314.log`, `run-final-node.log`, `run-node-b.log`, `run-node-baseline.log`, `run-node-bunfetch.log`, `run-node.log`, `sink-a.log`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sinkpid.txt`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REPRODUCED, THEN REFUTED. Same stack as the original report: @solidjs/start 2.0.2 + nitro 3.0.260610-beta + vite 8, develop SDK tarballs, `npx vite build` under node v26.5.0, then `bun .output/server/index.mjs` (bun 1.4.0). Probe dir: $SCRATCH/deep/verify4-M-solidstart-bun-outgoingfetch (app/ = copy of the repo e2e app dev-packages/e2e-tests/test-applications/solidstart-2 with three added routes; sink.mjs = qs/sink.mjs plus /__recorder + /__recorded; drive.sh = driver).

1) Baseline (docs-shaped wiring, no extra integration), bun, traceLifecycle 'static' - claim confirmed. Note that `node:http` DOES get a client span and headers on bun; only `fetch` is dead:
{"type":"transaction","name":"GET /api/fetchout","op":"http.server","spans":["middleware GET /api/fetchout","http.server GET /api/fetchout"]}
{"type":"transaction","name":"GET /api/httpout","op":"http.server","spans":["middleware GET /api/httpout","http.server GET /api/httpout","http.client GET http://127.0.0.1:41733/__recorder"]}
recorded headers: [{"sentry-trace":null,"baggage":null,"traceparent":null},{"sentry-trace":"bcc92fb3...-934619957709affe-1","baggage":"sentry-environment=production,..."}]
(first entry = the fetch call, second = the node:http call)

2) THE FIX - add the shipped `fetchIntegration` from @sentry/bun to the SolidStart nitro plugin's Sentry.init. It patches globalThis.fetch through core's addFetchInstrumentationHandler instead of the undici diagnostics channels that Bun's native fetch never emits. app/server/plugins/sentry.ts:

  import { fetchIntegration } from '@sentry/bun';
  import * as Sentry from '@sentry/solidstart';
  import { definePlugin } from 'nitro';
  const isBun = typeof (globalThis as any).Bun !== 'undefined';
  export default definePlugin(() => {
    Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static',
      integrations: isBun ? [fetchIntegration()] : [] });
  });

plus `npm install --legacy-peer-deps $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz`. @sentry/bun bundles cleanly into the nitro node output under vite (its only `bun` import is a type import), chunk `.output/server/_libs/@sentry/bun+[...].mjs 170.02 kB`. Result on bun (run-final-bun.log):
{"type":"transaction","name":"GET /api/fetchout","op":"http.server","status":"ok","trace_id":"9c09a46783c84e1fbeb0a59cb0e99448","spans":["middleware GET /api/fetchout","http.server GET /api/fetchout","http.client GET http://127.0.0.1:41733/__recorder"]}
recorded headers: [{"sentry-trace":"9c09a46783c84e1fbeb0a59cb0e99448-a55b59029034eec0-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=9c09a46783c84e1fbeb0a59cb0e99448,sentry-sampled=true,sentry-sample_rate=1"}, ...]
The client span is a child of the same trace as the server transaction, and both headers are propagated.

3) Also works with the develop default traceLifecycle 'stream' (run-bun-bunfetch-stream.log): {"type":"span","items":["middleware GET /api/fetchout","http.client GET 127.0.0.1","http.server GET",...],"raw":[...{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"92129ae5442cd864","origin":"auto.http.fetch"}...]}.

4) The `isBun` guard is required. On node with the integration unconditionally on, one fetch produces TWO identical client spans (undici instrumentation + the patched global fetch) (run-node-bunfetch.log):
{"type":"transaction","name":"GET /api/fetchout","spans":["http.server GET /api/fetchout","middleware GET /api/fetchout","http.server GET /api/fetchout","http.client GET http://127.0.0.1:41733/__recorder","http.client GET http://127.0.0.1:41733/__recorder"]}
With the guard, node is back to exactly one client span (run-final-node.log). node:http calls are never duplicated.

5) A hand-written integration using only @sentry/core (addFetchInstrumentationHandler + instrumentFetchRequest + isSentryRequestUrl) behaves identically (run-bun-globalfetch.log), which confirms the mechanism rather than anything bun-package specific; the @sentry/bun export is just the packaged form of it.

Rerun: `npm install --legacy-peer-deps $REPRO/_toolbox/pack/sentry-{solidstart,nitro,node,core,server-utils,server-runtime-injection,opentelemetry,solid,browser,browser-utils,replay,replay-canvas,feedback,bundler-plugins,bun}-10.67.0.tgz` in app/, `npx vite build`, then `PORT=41733 node ../sink.mjs &` and `SENTRY_TUNNEL=http://127.0.0.1:41733/ RECORDER_URL=http://127.0.0.1:41733/__recorder PORT=41734 bun .output/server/index.mjs`, then `../drive.sh 41733 41734 label`. app/node_modules was removed after the run; the built `.output` still runs standalone under bun and still emits the http.client span (verified post-clean). Bun CI pin 1.3.14 was not available on this machine any more ($SCRATCH/bun1314 is gone), so only bun 1.4.0 was tested.

## Workaround

In server/plugins/sentry.ts add `import { fetchIntegration } from '@sentry/bun'` and pass `integrations: typeof Bun !== 'undefined' ? [fetchIntegration()] : []` to Sentry.init (install @sentry/bun alongside @sentry/solidstart). The runtime guard matters: on node the same integration double-counts every fetch as two http.client spans. Without any change, outgoing requests made with `node:http`/`node:https` (and libraries built on them, e.g. axios' node adapter) are already instrumented and propagate headers on bun; only the global `fetch` is uninstrumented.

## Docs impact

On Bun, `@sentry/solidstart` does not trace outgoing `fetch` calls, because Bun's native fetch does not emit the undici diagnostics channels the Node SDK listens on; add `@sentry/bun` and pass `integrations: typeof Bun !== 'undefined' ? [fetchIntegration()] : []` to `Sentry.init()` in your Nitro plugin to get `http.client` spans and `sentry-trace`/`baggage` propagation (keep the runtime guard, since on Node this integration duplicates each fetch span; requests made through `node:http` are instrumented on Bun without any change).
