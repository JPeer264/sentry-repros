# verify4-M-solidstart-bun-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-solidstart-bun` (see `$REPRO/cells/M-solidstart-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-baseline.log`, `app-bunhttp.log`, `app-node-plain.log`, `app-node-withint.log`, `app-stream.log`, `appA-bun-baseline.log`, `appA.pid`, `appB-bun-bunhttp.log`, `appB.pid`, `appC-bun-nospans.log`, `appC.pid`, `appD-node.log`, `appD.pid`, `appE-bun-stream.log`, `appE.pid`, `appF-node-withint.log`, `appF.pid`, `build1.log`, `build2.log`, `drive2.mjs`, `sink-base.mjs`, `sink.log`, `sink.pid`, `sink2.log`, `sinkB.log`, `sinkB.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The reported breakage reproduces exactly with the docs-shaped wiring, and it is fixed by one line in the nitro plugin: adding `bunHttpServerIntegration()` from `@sentry/bun` to the `Sentry.init()` options. `@sentry/bun` on develop ships this integration precisely for this gap and its own `init()` enables it by default; `@sentry/solidstart` (which calls `@sentry/node`'s `init`) does not.

Root cause confirmed at the source: server-side request isolation lives only in `httpServerIntegration`, which does `subscribe(HTTP_ON_SERVER_REQUEST, ...)` on the `http.server.request.start` node:http diagnostics channel (`packages/node/src/integrations/http/httpServerIntegration.ts:151`, channel name at `packages/core/src/integrations/http/constants.ts:3`). Bun does not publish that channel, so `instrumentServer()` (`packages/core/src/integrations/http/server-subscription.ts:96`) — the code that clones the isolation scope and calls `continueTrace` — never runs. `@sentry/nitro`'s h3/srvx `dc.tracingChannel` subscribers do fire on bun, which is why spans exist, but they only call `startInactiveSpan` and never fork isolation. `packages/bun/src/integrations/bunHttpServer.ts:88-95` documents the same diagnosis and closes it by patching `http.Server.prototype.emit` and handing the server to the same core instrumentation.

EXACT CHANGE (server/plugins/sentry.ts):
  import { bunHttpServerIntegration } from '@sentry/bun';
  import * as Sentry from '@sentry/solidstart';
  import { definePlugin } from 'nitro';
  export default definePlugin(() => {
    Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static',
      integrations: [bunHttpServerIntegration()] });
  });
plus `npm install $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz` alongside the other tarballs. Nothing else changes: same vite.config.ts, same `src/middleware.ts`, same `npx vite build`, same `bun .output/server/index.mjs`.

=== bun, baseline (no integration) — reproduces the report ===
[bun-baseline] response trace ids: [{"tag":"alpha","traceparent":"fb595b89d81c458da2c0d252309defee-8c75f44859abfdca-1"},{"tag":"beta","traceparent":"fb595b89d81c458da2c0d252309defee-8da138c226ef91ee-1"},{"tag":"gamma","traceparent":"fb595b89d81c458da2c0d252309defee-b06bab4c63659d8e-1"}]
{"type":"event","exception":"Error: iso-alpha","trace_id":"fb595b89d81c458da2c0d252309defee","tags":{"probe_tag":"gamma"}}
{"type":"event","exception":"Error: iso-beta","trace_id":"fb595b89d81c458da2c0d252309defee","tags":{"probe_tag":"gamma"}}
{"type":"event","exception":"Error: iso-gamma","trace_id":"fb595b89d81c458da2c0d252309defee","tags":{"probe_tag":"gamma"}}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","trace_id":"fb595b89d81c458da2c0d252309defee","tags":{"probe_tag":"after"}}   <-- stale tag leaked into an unrelated later request

=== bun, SAME BUILD + bunHttpServerIntegration() — fixed ===
[bun-bunhttp] response trace ids: [{"tag":"alpha","traceparent":"2d1ddf2918794e0b82d9d4a79ad597d6-..."},{"tag":"beta","traceparent":"13d59d9c6ab54f67be889229a08376cd-..."},{"tag":"gamma","traceparent":"73db20ddafe04a8b844156e743ca0f3e-..."}]
{"type":"event","exception":"Error: iso-alpha","trace_id":"2d1ddf2918794e0b82d9d4a79ad597d6","tags":{"probe_tag":"alpha"}}
{"type":"event","exception":"Error: iso-beta","trace_id":"13d59d9c6ab54f67be889229a08376cd","tags":{"probe_tag":"beta"}}
{"type":"event","exception":"Error: iso-gamma","trace_id":"73db20ddafe04a8b844156e743ca0f3e","tags":{"probe_tag":"gamma"}}
{"type":"transaction","name":"GET /api/iso","op":"http.server","source":"url","trace_id":"2d1ddf2918794e0b82d9d4a79ad597d6","spans":["http.server GET /api/iso","middleware GET /api/iso","http.server GET /api/iso"]}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","trace_id":"72af3deb442341d78b983842981204a8"}   <-- no leaked tag

=== node reference, same build, no integration (parity target) ===
{"type":"event","exception":"Error: iso-alpha","trace_id":"c0ee86ddc319471d8d81ed7a5c8a0b59","tags":{"probe_tag":"alpha"}}
{"type":"transaction","name":"GET /api/iso","op":"http.server","source":"url","trace_id":"c0ee86ddc319471d8d81ed7a5c8a0b59","spans":["http.server GET /api/iso","middleware GET /api/iso","http.server GET /api/iso"]}
Bun with the integration is span-for-span identical to node: three spans per request, three distinct trace ids.

=== variants also verified ===
- `bunHttpServerIntegration({ spans: false })` on bun: isolation is equally fixed and the span shape stays the pre-fix two-span nitro shape (`["middleware GET /api/iso","http.server GET /api/iso"]`), for anyone who does not want the extra core-created server span. Trace ids distinct, tags correct.
- `traceLifecycle: 'stream'` on bun with the integration: also fixed — `{"type":"span","trace_id":"42d36945137046c6a6e7cb16888ad43c","items":["middleware GET /api/iso","http.server GET",...]}` with one distinct trace id per request and per-event tags correct.
- The same build run on node with SENTRY_BUN_HTTP=1 (integration active in the code) is byte-identical in behavior to node without it — `instrumentBunHttpServer` early-returns on `!process.versions.bun` — so one build is safe on both runtimes.

Probe files (rerunnable): $SCRATCH/deep/verify4-M-solidstart-bun-isolation/
  app/                          copy of the repo e2e app dev-packages/e2e-tests/test-applications/solidstart-2, unmodified except server/plugins/sentry.ts and three extra routes
  app/server/plugins/sentry.ts  init; SENTRY_BUN_HTTP unset = baseline, =1 = bunHttpServerIntegration(), =nospans = bunHttpServerIntegration({spans:false})
  app/src/routes/api/iso.ts     setTag('probe_tag'), random 50-300ms sleep, captureException, returns its own trace id
  app/src/routes/api/{ok,boom,sentinel}.ts
  drive2.mjs                    warm-up request, then 3 concurrent /api/iso?tag=alpha|beta|gamma, then an unrelated /api/iso?tag=after, then a sentinel it waits for before reading the sink
  sink-base.mjs                 sink keeping trace_id and tags
  appA-bun-baseline.log appB-bun-bunhttp.log appC-bun-nospans.log appD-node.log appE-bun-stream.log appF-node-withint.log build2.log
Commands:
  PORT=41337 node sink-base.mjs &
  (cd app && npx vite build)                                          # build under node
  SENTRY_TUNNEL=http://127.0.0.1:41337/ SENTRY_LIFECYCLE=static PORT=41338 HOST=127.0.0.1 bun app/.output/server/index.mjs &
  node drive2.mjs 41338 41337 bun-baseline
  # then the same with SENTRY_BUN_HTTP=1

## Workaround

Add `@sentry/bun` as a dependency and pass `bunHttpServerIntegration()` in the `integrations` array of the `Sentry.init()` call in `server/plugins/sentry.ts`. It patches `http.Server.prototype.emit` to hand each nitro node:http server to the same core request instrumentation the Node SDK gets from the `http.server.request.start` diagnostics channel that bun does not publish, which restores the per-request isolation scope and per-request trace. Use `bunHttpServerIntegration({ spans: false })` if you want to keep only nitro's own h3/srvx spans instead of also getting the core `http.server` span (node emits that span too, so the default is the parity choice). The integration no-ops on node (`process.versions.bun` guard), so a single build runs on both runtimes.

## Docs impact

On Bun, add `bunHttpServerIntegration()` from `@sentry/bun` to the `integrations` array of the `Sentry.init()` call in your nitro plugin: Bun does not emit the `http.server.request.start` diagnostics channel the Node SDK relies on, so without it every request shares one isolation scope and one trace id, and tags set on one request leak into the next. The integration does nothing when the same build runs on Node.
