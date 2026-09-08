# verify4-M-nextjs-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) from a Next.js 15.5.4 App Router route handler on Deno 2.9.0** of cell `M-nextjs-deno` (see `$REPRO/cells/M-nextjs-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO-v4.md`, `REPRO.md`, `app/`, `build-v4.log`, `build-v4auto.log`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `build7.log`, `build8.log`, `deno.json`, `instrumentation.js`, `next.config.mjs`, `package-lock.json`, `package.json`, `pids.txt`, `rec-a.log`, `rec-auto-deno.json`, `rec-auto-node.json`, `rec-base.json`, `rec-base2.json`, `rec-core.json`, `rec-nodewcg.json`, `rec-v4.log`, `rec-v4b.log`, `rec-wcg.json`, `rec-wcgstream.json`, `recorder.mjs`, `run-node.sh`, `run.sh`, `sentry-fetch-integration.js`, `sentry.server.config.js`, `server-a.log`, `server-auto-deno.log`, `server-auto-node.log`, `server-b.log`, `server-base.log`, `server-base2.log`, `server-c.log`, `server-core.log`, `server-d.log`, `server-e.log`, `server-nodewcg.log`, `server-wcg-stream.log`, `server-wcg.log`, `server-wcgstream.log`, `sink-a.log`, `sink-auto-deno.json`, `sink-auto-node.json`, `sink-base.json`, `sink-base2.json`, `sink-core.json`, `sink-nodewcg.json`, `sink-v4.log`, `sink-wcg.json`, `sink-wcgstream.json`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Baseline reproduced, then refuted with a one-line addition to `Sentry.init()`.

Probe dir: $SCRATCH/deep/verify4-M-nextjs-deno-outgoingfetch (node_modules removed; REPRO.md has the exact commands). deno 2.9.0 (stable, release, aarch64-apple-darwin), next@15.5.4, develop tarballs 10.67.0. Ports: sink 41611, recorder 41612, app 41613-41618.

A. BASELINE (the reported wiring: enableRuntimeChannelInjection:false, no fetch integration) — claim reproduced exactly.
recorder /__hits:
  {"url": "/rec", "sentry-trace": null, "baggage": null, "traceparent": null}
sink:
  {"type": "transaction", "name": "GET /api/fetch", "op": "http.server", "source": "route", "status": "ok", "trace_id": "264d96f6cc8d4999b0d299850680bed2", "sdk": "sentry.javascript.nextjs", "spans": ["resolve page components", "executing api route (app) /api/fetch/route", "start response"]}

B. FIX — `integrations: [winterCGFetchIntegration()]` from `@sentry/vercel-edge`, which is already a direct dependency of `@sentry/nextjs` (nothing extra to install). traceLifecycle 'static':
recorder /__hits (last):
  {"url": "/rec", "sentry-trace": "1939cc8124c84062b69e6380a88c8845-9f312eb3c272fd57-1", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=1939cc8124c84062b69e6380a88c8845,sentry-transaction=GET%20%2Fapi%2Ffetch,sentry-sampled=true,sentry-sample_rand=0.5965384308979094,sentry-sample_rate=1"}
sink:
  {"type": "transaction", "name": "GET /api/fetch", "op": "http.server", "source": "route", "status": "ok", "trace_id": "1939cc8124c84062b69e6380a88c8845", "sdk": "sentry.javascript.nextjs", "spans": ["resolve page components", "executing api route (app) /api/fetch/route", "http.client GET http://127.0.0.1:41612/rec", "start response"]}
The http.client span's trace_id equals the trace_id in the outgoing sentry-trace header, so distributed tracing out of the server is intact.

C. Same fix under traceLifecycle 'stream' (span envelopes):
  ["resolve page components", "http.client GET 127.0.0.1"]
  ["executing api route (app) /api/fetch/route", "start response", "http.server GET /api/fetch"]
  recorder: sentry-trace "a4f65c5faa5f432b8981a8b1922f9784-8e95e6f588a6096d-1", baggage present.

D. Equivalent hand-rolled integration also verified (sentry-fetch-integration.js): `addFetchInstrumentationHandler` + `instrumentFetchRequest` + `shouldPropagateTraceForUrl` + `isSentryRequestUrl` from `@sentry/core`, spanOrigin 'auto.http.fetch'. Produced the same http.client span and headers under both lifecycles. `tracePropagationTargets` is NOT needed (verified with it removed); the server default propagates everywhere.

Why it works: `@sentry/core`'s `instrumentFetch()` (packages/core/src/instrument/fetch.ts:47) deliberately skips the native-fetch probe outside the browser and always patches `GLOBAL_OBJ.fetch`, so it sees Deno's global fetch and also survives Next.js' own fetch patch. What is missing is only that no runtime SDK reachable from `@sentry/nextjs` on Deno registers such an integration: `@sentry/node` ships only undici/NodeFetch instrumentation, and `@sentry/deno` has no fetch integration at all (`@sentry/bun` and `@sentry/cloudflare` do, in their defaults). So the gap is a missing default, not a runtime limitation.

Unrelated trap worth recording: a failed `next build` leaves a corrupt distDir, and every subsequent build then dies with `SyntaxError: Unexpected end of input at .next/server/webpack-runtime.js` while collecting page data. This made a first winterCGFetch attempt look like an incompatibility; it built and ran fine after pointing `distDir` at a fresh directory. Do not conclude "package X breaks the Next build on Deno" without a clean distDir.

Not retested here (out of scope, unchanged): `enableRuntimeChannelInjection: false` is still required, otherwise every request 500s.

## Workaround

In `sentry.server.config.js`, add the WinterCG fetch integration (no extra install, `@sentry/vercel-edge` is already a dependency of `@sentry/nextjs`):

```js
import * as Sentry from '@sentry/nextjs';
import { winterCGFetchIntegration } from '@sentry/vercel-edge';

Sentry.init({
  dsn: '...',
  tracesSampleRate: 1.0,
  enableRuntimeChannelInjection: false, // required on Deno
  integrations: [winterCGFetchIntegration()],
});
```

Verified equivalent alternative, if pulling in `@sentry/vercel-edge` is unwanted: a ~30-line custom integration built on `addFetchInstrumentationHandler` + `instrumentFetchRequest` from `@sentry/core` (see sentry-fetch-integration.js in the probe dir).

## Docs impact

On Deno, the Node SDK's HTTP client instrumentation only sees `node:http`/undici requests, so calls made with the global `fetch` produce no `http.client` span and carry no `sentry-trace`/`baggage` headers; add `integrations: [winterCGFetchIntegration()]` from `@sentry/vercel-edge` (already installed with `@sentry/nextjs`) to your `Sentry.init()` to get outgoing-fetch spans and distributed tracing.
