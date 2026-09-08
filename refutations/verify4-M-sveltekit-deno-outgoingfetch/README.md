# verify4-M-sveltekit-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-sveltekit-deno` (see `$REPRO/cells/M-sveltekit-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-baseline-static.log`, `app-cffix-node.log`, `app-cffix-static.log`, `app-cffix-stream.log`, `app-userland-static.log`, `build.log`, `build2.log`, `install.log`, `install2.log`, `package-lock.json`, `package.json`, `pids.txt`, `rec.log`, `recorder.mjs`, `run-b-app-baseline.log`, `run-b-app-cffix.log`, `run-b-app-deno283.log`, `run-b-app-userland-stream.log`, `run-b-app-userland.log`, `run-b-rec.log`, `run-b-sink.log`, `sink.log`, `sink.mjs`, `src/`, `static/`, `svelte.config.js`, `vite.config.js`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced exactly, then found a one-line fix that fully repairs it — so the finding stands for the documented wiring, and the gap is a missing integration, not a runtime limitation.

Setup: SvelteKit 2.60 + adapter-node 5 + svelte 5 + vite 6, @sentry/sveltekit 10.67.0 (develop tarballs), `vite build` under node 26.5.0, run under deno 2.9.0 (aarch64-apple-darwin). hooks.server.js does `Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle })` at module top plus `sentryHandle()` / `handleErrorWithSentry()`. Sink on 51101, recorder on 51102. Probe dir: $SCRATCH/deep/verify4-M-sveltekit-deno-outgoingfetch/ (node_modules removed at the end; `npm install --no-audit --no-fund` recreates it, then `npx vite build`).

A) BASELINE, documented wiring, traceLifecycle 'static' (run-b-app-baseline.log). Global `fetch()` -> no span; SvelteKit's own `event.fetch` -> no span either; `node:http` -> span, as reported:
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","spans":[],"hasRequestData":false}
{"type":"transaction","name":"GET /eventfetch","op":"http.server","source":"route","status":"ok","spans":[],"hasRequestData":false}
{"type":"transaction","name":"GET /httpout","op":"http.server","source":"route","status":"ok","spans":["http.client GET http://127.0.0.1:51102/rec-http"],"hasRequestData":false}
recorder:
{"path":"/rec-fetch","sentryTrace":null,"baggage":null,"traceparent":null}
{"path":"/rec-eventfetch","sentryTrace":null,"baggage":null,"traceparent":null}
{"path":"/rec-http","sentryTrace":"69e303992a5c4eb4aa2e24cea0a62a16-9b363fae35f1e55e-1","baggage":"sentry-environment=production,...,sentry-transaction=GET%20%2Fhttpout,...","traceparent":null}
Command: `HOST=127.0.0.1 PORT=51110 SINK_PORT=51101 REC_PORT=51102 LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys build/index.js`

Root cause confirmed in source, not guessed: @sentry/node's fetch instrumentation is purely a `diagnostics_channel` subscriber on `undici:request:create` / `undici:client:sendHeaders` / `undici:request:headers` / `undici:request:trailers` / `undici:request:error` (~/dev/sentry-worktrees/audit-runtime-docs/packages/node/src/integrations/node-fetch/undici-instrumentation.ts:107-113). Deno's `fetch` is native Rust, not undici, so nothing ever publishes on those channels. Grepping `addFetchInstrumentationHandler|instrumentFetchRequest` across packages/node/src and packages/sveltekit/src returns nothing: neither package patches `globalThis.fetch`, so no option or init placement can fix this. `traceLifecycle`, init placement, and hook shape are all irrelevant to it.

B) FIX THAT WORKS — add a global-fetch integration. Two variants, both verified end to end.

B1) Shipped SDK code, one line: `integrations: [fetchIntegration()]` imported from `@sentry/cloudflare` (packages/cloudflare/src/integrations/fetch.ts, the WinterCG-style `globalThis.fetch` patcher). traceLifecycle 'static' (run-b-app-cffix.log):
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","spans":["http.client GET http://127.0.0.1:51102/rec-fetch"],"hasRequestData":false}
{"type":"transaction","name":"GET /eventfetch","op":"http.server","source":"route","status":"ok","spans":["http.client GET http://127.0.0.1:51102/rec-eventfetch"],"hasRequestData":false}

B2) ~25-line userland integration built only from `@sentry/core` exports (`addFetchInstrumentationHandler`, `instrumentFetchRequest`, `isSentryRequestUrl`, `shouldPropagateTraceForUrl`, `LRUMap`, `defineIntegration`) — file src/userland-fetch-integration.js in the probe dir. traceLifecycle 'static' (run-b-app-userland.log):
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","spans":["http.client GET http://127.0.0.1:51102/rec-fetch"],"hasRequestData":false}
{"type":"transaction","name":"GET /eventfetch","op":"http.server","source":"route","status":"ok","spans":["http.client GET http://127.0.0.1:51102/rec-eventfetch"],"hasRequestData":false}
recorder, both headers now on the wire:
{"path":"/rec-fetch","sentryTrace":"44c5cdb2c2d94017b55acbb98b9560b6-9dedde8fa70d6c7f-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=44c5cdb2c2d94017b55acbb98b9560b6,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.06871537103408998,sentry-sample_rate=1","traceparent":null}
{"path":"/rec-eventfetch","sentryTrace":"3c2f8274677543f5adb5e83442849b33-b4472cb93e1990de-1","baggage":"...sentry-transaction=GET%20%2Feventfetch,sentry-sampled=true,...","traceparent":null}
Also correct under the develop default traceLifecycle 'stream' (run-b-app-userland-stream.log) — child span, right parent, right origin, and the tunnel's own fetch is correctly excluded:
{"type":"span","trace_id":"af2f8d3fd49a4f678c65d8e56485e95e","items":["http.client GET 127.0.0.1","http.server GET /fetchout"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"a422d3032d1b7343","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET /fetchout","status":"ok","is_segment":true,"origin":"auto.http.sveltekit"}]}

Variants tried and their outcome: traceLifecycle 'static' and 'stream' — no difference to the baseline break; SvelteKit's `event.fetch` instead of global `fetch` — same break (new data point the original probe did not have; it is worse than reported, since the framework's own fetch is affected too); init placement is fixed by SvelteKit (hooks.server.js top level) and already works, the SDK logs "SDK initialized from ESM"; the repo's own reference app dev-packages/e2e-tests/test-applications/sveltekit-2-svelte-5/src/hooks.server.ts uses exactly the wiring tested (init + sentryHandle + handleErrorWithSentry, no fetch integration), confirming there is nothing extra a user is supposed to add. Deno 2.8.3 (CI pin) not tested: $S/deno283 no longer exists on this machine.

Verdict is confirmed-broken rather than works-after-all because no documented wiring, option, init placement, lifecycle or bundler variant fixes it — the only fixes are adding an integration that no SvelteKit/Node/Deno docs page mentions, one of which lives in the wrong package (@sentry/cloudflare) and one of which the user has to write.

## Workaround

Either (a) one line, using shipped SDK code: `import { fetchIntegration } from '@sentry/cloudflare';` and `Sentry.init({ ..., integrations: [fetchIntegration()] })` in hooks.server.js — verified to produce the `http.client` span and both `sentry-trace` and `baggage` headers under both trace lifecycles, including for SvelteKit's `event.fetch`; or (b) copy the WinterCG fetch patcher into the app as a userland integration from `@sentry/core` primitives (`addFetchInstrumentationHandler` + `instrumentFetchRequest` + `isSentryRequestUrl` + `shouldPropagateTraceForUrl`), see src/userland-fetch-integration.js in the probe dir. Both are ~equally effective; (a) drags @sentry/cloudflare into a Deno server dependency tree, (b) keeps the dependency list clean. The pre-existing escape hatch of switching the call to `node:http` also works but changes application code. The real fix belongs in the SDK: `@sentry/node` (or `@sentry/deno`) should ship a global-fetch integration and enable it when the undici diagnostics channels are absent, which is exactly the Deno case.

## Docs impact

On Deno, outgoing requests made with the global `fetch()` (including SvelteKit's `event.fetch`) get no `http.client` span and no `sentry-trace`/`baggage` headers, because Sentry's Node fetch instrumentation listens on undici's `diagnostics_channel` events and Deno's `fetch` is native rather than undici; until the SDK ships a global-fetch integration for this runtime, either add `fetchIntegration()` from `@sentry/cloudflare` to `integrations`, or make the call through `node:http`/`node:https`, which is instrumented and propagates trace headers correctly.
