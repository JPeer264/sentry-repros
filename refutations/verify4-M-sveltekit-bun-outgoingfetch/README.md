# verify4-M-sveltekit-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) from a SvelteKit server route running on bun** of cell `M-sveltekit-bun` (see `$REPRO/cells/M-sveltekit-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.md`, `app/`, `app-baseline-stream.log`, `app-bun-baseline.log`, `app-bun-fetchintegration-stream.log`, `app-bun-fetchintegration.log`, `app-bun-gated.log`, `app-bunfetch-static-b1314.log`, `app-bunfetch-static.log`, `app-bunfetch-stream.log`, `app-guarded-stream.log`, `app-node-bunfetch-stream.log`, `app-node-control.log`, `app-node-fetchintegration.log`, `app.pid`, `build-baseline-stream.log`, `build-bunfetch-static.log`, `build-bunfetch-stream.log`, `build-guarded-stream.log`, `items-baseline-stream.json`, `items-bunfetch-static-b1314.json`, `items-bunfetch-static.json`, `items-bunfetch-stream.json`, `items-guarded-stream.json`, `items-node-bunfetch-stream.json`, `probe.sh`, `rec-baseline-stream.json`, `rec-bunfetch-static-b1314.json`, `rec-bunfetch-static.json`, `rec-bunfetch-stream.json`, `rec-guarded-stream.json`, `rec-node-bunfetch-stream.json`, `run2.sh`, `sink-baseline-stream.log`, `sink-bunfetch-static-b1314.log`, `sink-bunfetch-static.log`, `sink-bunfetch-stream.log`, `sink-guarded-stream.log`, `sink-node-bunfetch-stream.log`, `sink.log`, `sink.mjs`, `sink.mjs.bak`, `sink.mjs.bak2`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The reported symptom reproduces exactly, but it is a missing-integration problem with a one-line fix, not a bun limitation.

## Setup (all under $SCRATCH/deep/verify4-M-sveltekit-bun-outgoingfetch/)

`npx sv@latest create --template minimal --types ts --no-add-ons --no-install app` -> SvelteKit ^2.63.0, svelte ^5.56.1, vite ^8.0.16 (same shape the reporter used: no `svelte.config.js`, kit config inside the `sveltekit()` Vite plugin). Then `npm install @sveltejs/adapter-node` and the develop tarball set on one line:

```
npm install $S/pack/sentry-sveltekit-10.67.0.tgz $S/pack/sentry-node-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $S/pack/sentry-opentelemetry-10.67.0.tgz $S/pack/sentry-browser-10.67.0.tgz $S/pack/sentry-svelte-10.67.0.tgz \
  $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-bundler-plugins-10.67.0.tgz $S/pack/sentry-browser-utils-10.67.0.tgz \
  $S/pack/sentry-replay-10.67.0.tgz $S/pack/sentry-replay-canvas-10.67.0.tgz $S/pack/sentry-feedback-10.67.0.tgz \
  $S/pack/sentry-bun-10.67.0.tgz
```

(I confirm the reporter's packing note: `@sentry/browser-utils`, `@sentry/replay` (packages/replay-internal), `@sentry/replay-canvas`, `@sentry/feedback` were not in `$S/pack` and had to be `npm pack`ed from the worktree. I added them to `$S/pack` for later agents. `@sentry/bundler-plugins` WAS already there.)

Wiring is the reporter's: `sentrySvelteKit({ autoUploadSourceMaps: false, adapter: 'node' })` from `@sentry/sveltekit/vite` before `sveltekit({ adapter: adapter(), experimental: { instrumentation: { server: true }, tracing: { server: true } } })`; `src/instrumentation.server.ts` calls `Sentry.init`; `src/hooks.server.ts` exports `sentryHandle()`/`handleErrorWithSentry()`. Route `src/routes/api/out/+server.ts` does a bare global `await fetch(`${process.env.REC_URL}/__rec/from-sveltekit`)`. Sink at `sink.mjs` (copy of `$S/qs/sink.mjs` plus a `/__rec/` header recorder readable at `/__recs`), port 47611. Build: `npx vite build`. Run: `PORT=<port> SENTRY_TUNNEL=http://127.0.0.1:47611/ REC_URL=http://127.0.0.1:47611 bun build/index.js`. Driven with `curl` from outside the app process, sentinel = `Sentry.captureMessage('sentinel')` on `/api/hello`.

## 1. Baseline on bun 1.4.0 — symptom reproduced (app-bun-baseline.log)

```
{"type":"transaction","name":"GET /api/out","op":"http.server","source":"route","status":"ok","trace_id":"b3ee296ec7544f148a5e66727f6e063c","sdk":"sentry.javascript.sveltekit","spans":["function sveltekit.resolve"],"hasRequestData":false}
--- recs ---
[{"url":"/__rec/from-sveltekit","sentry-trace":null,"baggage":null,"traceparent":null}]
```

## 2. node v26.5.0 control, identical `build/` (app-node-control.log)

```
{"type":"transaction","name":"GET /api/out",...,"trace_id":"29a371b67451408593e59e79a3d660d1",...,"spans":["function sveltekit.resolve","http.client GET http://127.0.0.1:47611/__rec/from-sveltekit"]}
--- recs ---
{"url":"/__rec/from-sveltekit","sentry-trace":"29a371b67451408593e59e79a3d660d1-94ff6be37a904a0d-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=29a371b67451408593e59e79a3d660d1,sentry-transaction=GET%20%2Fapi%2Fout,sentry-sampled=true,...","traceparent":null}
```

So the reporter's claim and root cause (`@sentry/node`'s NodeFetch integration is undici-diagnostics-channel-based, and bun does not emit `undici:request:create`) are both correct as stated.

## 3. The fix: add `fetchIntegration()` from `@sentry/bun`

`@sentry/bun` ships its own fetch integration that does not touch diagnostics_channel — it patches global `fetch` via `addFetchInstrumentationHandler` from `@sentry/core` (worktree `packages/bun/src/integrations/fetch.ts`, exported at `packages/bun/src/index.ts:209`). `@sentry/sveltekit` on the server is `@sentry/node`, so it never gets that integration, but nothing stops you adding it.

`src/instrumentation.server.ts`:
```ts
import { fetchIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/sveltekit';

const isBun = typeof globalThis.Bun !== 'undefined';

Sentry.init({
  dsn: '...',
  tracesSampleRate: 1.0,
  tunnel: process.env.SENTRY_TUNNEL,
  integrations: isBun ? [fetchIntegration()] : [],
});
```

bun, `traceLifecycle: 'static'` (app-bun-gated.log):
```
{"t":"transaction","name":"GET /api/out","spans":["function sveltekit.resolve","http.client GET http://127.0.0.1:47611/__rec/from-sveltekit"],"trace":"338f9934865349a78662bc3b8cdb2946"}
--- recs (last) ---
{"url":"/__rec/from-sveltekit","sentry-trace":"338f9934865349a78662bc3b8cdb2946-862e814c4e19d21f-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=338f9934865349a78662bc3b8cdb2946,sentry-transaction=GET%20%2Fapi%2Fout,sentry-sampled=true,sentry-sample_rate=1","traceparent":null}
```
The client span's parent trace id matches the server transaction's, and the recorder now sees both headers.

bun, default `traceLifecycle: 'stream'` (app-bun-fetchintegration-stream.log) — also works, span name is the low-cardinality form:
```
{"t":"span","items":["http.client GET 127.0.0.1","function sveltekit.resolve","http.server GET /api/out"]}
```

## 4. Why the `isBun` gate is required

Without the gate, the same build on node emits the span TWICE (bun's `fetchIntegration` and node's undici NodeFetch integration both fire) — app-node-fetchintegration.log:
```
{"t":"transaction","name":"GET /api/out","spans":["function sveltekit.resolve","http.client GET http://127.0.0.1:47611/__rec/from-sveltekit","http.client GET http://127.0.0.1:47611/__rec/from-sveltekit"]}
```
So the integration must be added conditionally, or the app must be bun-only.

## Notes and confirmations of the reporter's other observations

- `@sentry/sveltekit/vite` (not `@sentry/sveltekit`) is where `sentrySvelteKit` lives on develop; the repo's own e2e app agrees (`dev-packages/e2e-tests/test-applications/sveltekit-2-kit-tracing/vite.config.ts` imports from `@sentry/sveltekit/vite`).
- The e2e reference app uses exactly this `instrumentation.server.ts` + `experimental.{instrumentation,tracing}.server: true` shape (`svelte.config.js` there, `vite.config.ts` here on kit 2.63), so that part of the wiring is the intended one, not a workaround. Its `http.client` assertion is in `tests/tracing.test.ts:176`.
- `contexts.runtime.name` is reported as `node` on bun for `@sentry/sveltekit` (the `@sentry/bun` `init` that sets `runtime: { name: 'bun' }` is never called). Cosmetic, but it means bun SvelteKit events are indistinguishable from node ones in Sentry.
- The reporter's second setup fact (no span envelopes at all when `Sentry.init` is called from `hooks.server.ts` instead of `instrumentation.server.ts`) is a separate capability; I did not re-test it.

## Cleanup

Both servers killed. `app/node_modules` (178M) left in place so the probe can be rerun with `npx vite build && PORT=<port> SENTRY_TUNNEL=... REC_URL=... bun build/index.js`.

## Workaround

In `src/instrumentation.server.ts`, install `@sentry/bun` alongside `@sentry/sveltekit` and pass its fetch integration into `Sentry.init`, gated on the runtime so node builds do not get a duplicate span:

```ts
import { fetchIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: '...',
  tracesSampleRate: 1.0,
  integrations: typeof globalThis.Bun !== 'undefined' ? [fetchIntegration()] : [],
});
```

Verified on bun 1.4.0 with both `traceLifecycle: 'static'` and the default `'stream'`: the `http.client` span appears under the `http.server` segment and the outgoing request carries `sentry-trace` and `baggage` with the server transaction's trace id.

## Docs impact

On the SvelteKit guide's bun/adapter-node page: "`@sentry/sveltekit` uses `@sentry/node` on the server, and its outgoing-`fetch` instrumentation relies on Node's `undici` diagnostics channel, which bun does not emit — so on bun, `fetch()` calls from your server routes produce no `http.client` span and carry no `sentry-trace`/`baggage` headers. Install `@sentry/bun` and add its `fetchIntegration()` to `Sentry.init` in `src/instrumentation.server.ts`, guarding it with `typeof globalThis.Bun !== 'undefined'` so a build that also runs on Node does not record the span twice."
