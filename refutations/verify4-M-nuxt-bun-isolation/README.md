# verify4-M-nuxt-bun-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-nuxt-bun` (see `$REPRO/cells/M-nuxt-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `README-verify4.txt`, `app/`, `app-baseline2.log`, `app-fixed.log`, `app-nuxt-bunserverint.log`, `app-nuxtsdk.log`, `app-static.log`, `app.pid`, `build-A.log`, `build-A2.log`, `build-B.log`, `build-C.log`, `dc-check.mjs`, `drive.mjs`, `pids.txt`, `pids2.txt`, `pids3.txt`, `pidsB.txt`, `pidsC.txt`, `resultA.json`, `resultA3.json`, `resultB.json`, `resultC.json`, `runA.log`, `runA2.log`, `runA3.log`, `runB.log`, `runC.log`, `sink.log`, `sink5.mjs`, `sinkA.log`, `sinkA2.log`, `sinkA3.log`, `sinkB.log`, `sinkC.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Reproduced the reported breakage exactly, then refuted it with a one-line, user-land change that keeps `@sentry/nuxt` as the SDK.

Setup (all files under $SCRATCH/deep/verify4-M-nuxt-bun-isolation/):
Nuxt 4.5.2, nitropack 2.13.4, h3 1.15.11, bun 1.4.0, @sentry/nuxt 10.67.0 from develop (tarballs), `sentry: { autoInjectServerSentry: 'top-level-import', debug: true }`.
  cd app && NITRO_PRESET=bun npx nuxt build
  PORT=52882 node ../sink5.mjs &                 # sink records trace_id, tags, transaction
  cd app && PORT=52881 bun run .output/server/index.mjs &
  APP_PORT=52881 SINK=http://127.0.0.1:52882 node ../drive.mjs
drive.mjs does one GET /api/error (to plant a transaction name), then three concurrent GET /api/iso?tag=alpha|beta|gamma (each `Sentry.setTag('probe_tag', tag)`, jittered delay, `captureException`), then GET /api/sentinel (`captureMessage('sentinel')` + `flush`) as the sentinel.

A. Documented wiring, `import * as Sentry from '@sentry/nuxt'` only (runA3.log / resultA3.json) — BROKEN, matches the report:
  {"type":"event","exception":"nuxt-bun-route-error","transaction":"GET /api/error","trace_id":"76bca958a82c46aab4f5405c9198799f"}
  {"type":"event","exception":"iso-alpha","transaction":"GET /api/error","trace_id":"76bca958a82c46aab4f5405c9198799f","tags":{"probe_tag":"alpha"}}
  {"type":"event","exception":"iso-beta","transaction":"GET /api/error","trace_id":"76bca958a82c46aab4f5405c9198799f","tags":{"probe_tag":"beta"}}
  {"type":"event","exception":"iso-gamma","transaction":"GET /api/error","trace_id":"76bca958a82c46aab4f5405c9198799f","tags":{"probe_tag":"gamma"}}
  {"type":"event","message":"sentinel","transaction":"GET /api/error","trace_id":"76bca958a82c46aab4f5405c9198799f"}
Tags isolate; one trace id for the whole process; `GET /api/error` leaks onto every later event; zero spans. Server log: `Patched h3 event handler. Created new isolation scope.` x6, `Using existing` x0.

C. Same wiring plus `traceLifecycle: 'static'` (runC.log / resultC.json) — BROKEN identically. All five events carry trace_id f94fd5bbf8b2479aae04cfcf2ec1fd5c and `"transaction":"GET /api/error"`. The other trace lifecycle does not rescue it.

B. THE FIX — add `bunServerIntegration()` from `@sentry/bun` to the same `@sentry/nuxt` init (runB.log / resultB.json) — WORKS:
  {"type":"event","exception":"iso-alpha","trace_id":"7ab860dec0e64078a9a4dcda65a6b3ee","tags":{"probe_tag":"alpha"}}
  {"type":"event","exception":"iso-gamma","trace_id":"338781f4e60c404c929c9f31b5e6868c","tags":{"probe_tag":"gamma"}}
  {"type":"event","exception":"iso-beta","trace_id":"697555049144412d9c9eac533bdccc80","tags":{"probe_tag":"beta"}}
  {"type":"span","name":"GET /api/iso","op":"http.server","trace_id":"7ab860dec0e64078a9a4dcda65a6b3ee"}
  {"type":"span","name":"GET /api/iso","op":"http.server","trace_id":"338781f4e60c404c929c9f31b5e6868c"}
  {"type":"span","name":"GET /api/iso","op":"http.server","trace_id":"697555049144412d9c9eac533bdccc80"}
  {"type":"event","message":"sentinel","trace_id":"b11aa6ac64934e9696d32a2095aa4eba"}
Three distinct trace ids, each event's trace id equal to its own http.server span's, no stale transaction on any event, spans present and route-named. `sdk` stays `sentry.javascript.nuxt`. Server log flips to `Integration installed: BunServer` and `Patched h3 event handler. Using existing isolation scope.` x5, `Created new` x0 — the Bun.serve wrapper's `withIsolationScope` + `continueTrace` now runs first, so `patchEventHandler` correctly reuses the request-scoped isolation scope instead of cloning the default one.

Mechanism confirmed: packages/nuxt/src/runtime/utils/patchEventHandler.ts clones `getDefaultIsolationScope()` and never touches the propagation context, so every clone inherits the same process-lifetime trace id. On node the OTel http server span supplies a fresh propagation context and transaction name per request; under the nitro `bun` preset the server is `Bun.serve` and nothing in `@sentry/node`'s default integrations touches it. `bunServerIntegration` (packages/bun/src/integrations/bunserver.ts) proxies `Bun.serve` and does exactly the missing work.

Residual gap (not the capability under test): in variant B the manually captured `iso-*` events carry no `transaction` field at all. Only errors that flow through nitro's `error` hook get one, via `sentryCaptureErrorHook`'s `getCurrentScope().setTransactionName()`. `bunServerIntegration` sets the span name but not the scope's transaction name, so `Sentry.captureException` called directly inside a handler produces an event with no transaction. That is strictly better than the wrong, stale name in variant A.

Caveat: `bunServerIntegration()` is an undocumented cross-package import for Nuxt users and requires adding `@sentry/bun` as an explicit dependency. The proper fix is for `@sentry/nuxt`'s server SDK (or `patchEventHandler`) to detect `process.versions.bun` and either install this integration or, at minimum, call `newIsolationScope.setPropagationContext({ traceId: generateTraceId() })` when it creates the clone.

## Workaround

In `sentry.server.config.ts`, install `@sentry/bun` alongside `@sentry/nuxt` and pass its Bun.serve integration:

  import { bunServerIntegration } from '@sentry/bun'
  import * as Sentry from '@sentry/nuxt'

  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    integrations: [bunServerIntegration()],
  })

Build with `NITRO_PRESET=bun npx nuxt build` and `sentry: { autoInjectServerSentry: 'top-level-import' }` (bun ignores NODE_OPTIONS and has no `--import`, so the documented `node --import ./.output/server/sentry.server.config.mjs` path is unavailable). Run with `bun run .output/server/index.mjs`. This restores per-request trace ids, stops the stale transaction name leaking across requests, and additionally turns on route-named `http.server` spans, while keeping the `sentry.javascript.nuxt` SDK and all Nuxt-specific instrumentation. Replacing the init with `@sentry/bun` entirely also works but gives up the Nuxt SDK identity.

## Docs impact

On the Nuxt install pages (`docs/platforms/javascript/guides/nuxt/install/limited-server-tracing.mdx` and `install/index.mdx`, which currently never mention bun), add: "Running a Nuxt server on Bun (`NITRO_PRESET=bun`) requires `autoInjectServerSentry: 'top-level-import'` — Bun ignores `NODE_OPTIONS` and has no `--import` flag — and additionally requires installing `@sentry/bun` and passing `integrations: [bunServerIntegration()]` to `Sentry.init` in `sentry.server.config.ts`; without it the server runs on `Bun.serve`, which no instrumentation touches, so every event in the process shares one trace id, carries the transaction name of an unrelated earlier request, and no server spans are recorded."
