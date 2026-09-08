# verify4-M-reactrouter-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-reactrouter-deno` (see `$REPRO/cells/M-reactrouter-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-base-static.log`, `app-base-stream-debug.log`, `app-corefetch-static.log`, `app-corefetch-stream.log`, `app-undiciglobal-static.log`, `app.pid`, `build1.log`, `build2.log`, `deno-fetch-integration.mjs`, `deno.json`, `install-cf.log`, `install.log`, `instrument.server.mjs`, `package-lock.json`, `package.json`, `r-app-base-static.log`, `r-app-base-stream.log`, `r-app-cf-fetch-integration-static.log`, `r-app-cf-fetch-integration-stream.log`, `r-app-core-fetch-integration-static.log`, `r-app-core-fetch-integration-stream.log`, `r-app-explicit-nodefetch-static.log`, `r-app-undici-global-static.log`, `r-rec-base-static.log`, `r-rec-base-stream.log`, `r-rec-cf-fetch-integration-static.log`, `r-rec-cf-fetch-integration-stream.log`, `r-rec-core-fetch-integration-static.log`, `r-rec-core-fetch-integration-stream.log`, `r-rec-explicit-nodefetch-static.log`, `r-rec-undici-global-static.log`, `r-sink-base-static.log`, `r-sink-base-stream.log`, `r-sink-cf-fetch-integration-static.log`, `r-sink-cf-fetch-integration-stream.log`, `r-sink-core-fetch-integration-static.log`, `r-sink-core-fetch-integration-stream.log`, `r-sink-explicit-nodefetch-static.log`, `r-sink-undici-global-static.log`, `react-router.config.ts`, `rec.log`, `rec.pid`, `recorder.mjs`, `run.sh`, `server.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `tsconfig.json`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Could not refute. Global `fetch` from a React Router v7.18.3 loader on deno 2.9.0 with @sentry/react-router 10.67.0 (develop) produces no http.client span and sends no sentry-trace/baggage, under every supported knob I tried. It IS fixable, but only with user code the SDK does not ship for this stack.

Probe dir: $SCRATCH/deep/verify4-M-reactrouter-deno-outgoingfetch/
  run.sh                        one variant per invocation: ./run.sh <variant> <static|stream> <app-port>
  instrument.server.mjs         Sentry.init, variant switch (base | explicit-nodefetch | core-fetch-integration | cf-fetch-integration | undici-global)
  deno-fetch-integration.mjs    ~30-line userland integration built only from @sentry/core exports
  server.mjs                    node:http adapter, `import './instrument.server.mjs'` first
  app/routes/{fetchout,httpout,undicifetch,sentinel}.tsx
  app/entry.server.tsx          renderToReadableStream + wrapSentryHandleRequest + createSentryHandleError
  vite.config.ts                plain `reactRouter()` (same as the repo e2e app react-router-7-framework)
  r-app-*.log, r-sink-*.log, r-rec-*.log
Rerun: `npx react-router build && ./run.sh base static 47321`
Note: r-sink-core-fetch-integration-stream.log / r-sink-explicit-nodefetch-static.log show EADDRINUSE because another agent's sink held 47311; those two runs' envelopes landed in that sink and were read from it. Rows are unambiguous (sdk `sentry.javascript.react-router`, my trace ids). The last two runs use 47411/47412 and are clean.

1. BASELINE, documented wiring, traceLifecycle static (r-app-base-static.log):
{"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"7f6d95ece24e4329b62bedad2593e9a8","sdk":"sentry.javascript.react-router","spans":[]}
{"url":"/rec-fetch","sentryTrace":null,"baggage":null}
Same request's node:http control works:
{"type":"transaction","name":"GET /httpout",...,"spans":["http.client GET http://127.0.0.1:47312/rec-http"]}
{"url":"/rec-http","sentryTrace":"69acd4c448da4188b3533ba0526075f9-9de223f498e54f6e-1","baggage":"sentry-environment=production,...,sentry-sampled=true,..."}

2. BASELINE, traceLifecycle stream (clean sink 47411):
{"type":"span","trace_id":"2eeceb43187c42ef92091fc7166e6299","items":["http.server GET /fetchout"],"raw":[{"name":"GET /fetchout","status":"ok","is_segment":true,"origin":"auto.http.react_router.request_handler"}]}
{"url":"/rec-fetch","sentryTrace":null,"baggage":null}
So the lifecycle is irrelevant; the span never exists.

3. EXPLICIT FIRST-PARTY KNOB `Sentry.nativeNodeFetchIntegration({ spans: true })` — no effect:
{"type":"transaction","name":"GET /fetchout",...,"trace_id":"eddbf498c65649e8b8f6fd3f79eba470","spans":[]}
{"url":"/rec-fetch","sentryTrace":null,"baggage":null}

4. NEW NUANCE that refines the K2 statement: undici's diagnostics channels DO fire under Deno. `import { fetch } from 'undici'` in a loader is instrumented out of the box, with no config change, in every variant including the baseline:
{"type":"transaction","name":"GET /undicifetch",...,"spans":["http.client GET http://127.0.0.1:47312/rec-undici"]}
{"url":"/rec-undici","sentryTrace":"ed87e171550e46fea66c2ce09ae2b3b8-a3baf84b87604eae-1","baggage":"..."}
stream: {"name":"GET 127.0.0.1","parent_span_id":"904d0c9ddc0dead8","is_segment":false,"origin":"auto.http.node_fetch"}
So the defect is narrower than "NodeFetch hooks do not work on Deno": Deno's *native global* fetch is simply not undici, and nothing in @sentry/node/@sentry/react-router patches the global.

5. THREE WORKAROUNDS, each restoring a correctly nested span plus both headers on plain global `fetch`:
(a) userland integration from @sentry/core primitives (`addFetchInstrumentationHandler` + `instrumentFetchRequest`), static:
{"type":"transaction","name":"GET /fetchout",...,"trace_id":"9addb70f2dae4d7496f4443e2ae85930","spans":["http.client GET http://127.0.0.1:47312/rec-fetch"]}
{"url":"/rec-fetch","sentryTrace":"9addb70f2dae4d7496f4443e2ae85930-b4d778a47febefa2-1","baggage":"...sentry-sampled=true..."}
    stream: {"name":"GET 127.0.0.1","status":"ok","parent_span_id":"be172e4cdbf044a2","is_segment":false,"origin":"auto.http.fetch"} nested under {"name":"GET /fetchout","is_segment":true}
(b) `fetchIntegration()` imported from @sentry/cloudflare (first-party code, wrong package), stream, clean sink:
{"type":"span","trace_id":"1a50db0c6d474a20b2f7e3be1fa58c79","items":["http.client GET 127.0.0.1","http.server GET /fetchout"],"raw":[{"name":"GET 127.0.0.1","parent_span_id":"a1e9a876b7d985b0","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET /fetchout","is_segment":true,...}]}
{"url":"/rec-fetch","sentryTrace":"1a50db0c6d474a20b2f7e3be1fa58c79-99c18ef9ce7d0ba4-1","baggage":"..."}
(c) `globalThis.fetch = (await import('undici')).fetch` before Sentry.init, static:
{"type":"transaction","name":"GET /fetchout",...,"trace_id":"a6362f9fd57f4663a9a179b63fd18a28","spans":["http.client GET http://127.0.0.1:47312/rec-fetch"]}
{"url":"/rec-fetch","sentryTrace":"a6362f9fd57f4663a9a179b63fd18a28-aa1319ff12d40a4b-1","baggage":"..."}

Not tried / not applicable: `react-router-serve` and `NODE_OPTIONS='--import ./instrument.mjs'` (the repo e2e app's start script, dev-packages/e2e-tests/test-applications/react-router-7-framework/package.json) remain unusable on Deno for the reasons the earlier agent recorded; entry shape and init placement are irrelevant to fetch since the http.server span and the node:http client span are both correct in every run.
Docs: ~/dev/sentry-docs/docs/platforms/javascript/guides/react-router/ has no Deno mention at all, and .../guides/deno/index.mdx has no fetch caveat.

## Workaround

Add a fetch integration by hand in instrument.server.mjs; nothing else is needed and both trace lifecycles work. Cheapest version, ~30 lines with no extra dependency (deno-fetch-integration.mjs in the probe dir):

import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl } from '@sentry/core';
export const denoFetchIntegration = defineIntegration(() => {
  const headersUrlMap = new LRUMap(100); const spans = {};
  return { name: 'DenoFetch', setupOnce() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient(); if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true,
        url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
        spans, { spanOrigin: 'auto.http.fetch' });
    });
  } };
});
then `Sentry.init({ ..., integrations: [denoFetchIntegration()] })`.

Equivalent alternatives: `integrations: [fetchIntegration()]` with `fetchIntegration` imported from @sentry/cloudflare (verified working under Deno), or `globalThis.fetch = (await import('undici')).fetch` before Sentry.init (verified; costs an `undici` dependency and replaces Deno's native fetch). Guard any of these to Deno only: on Node the global fetch is already undici-backed and the NodeFetch integration would then emit a duplicate http.client span.

## Docs impact

On Deno, the Node-based SDKs (@sentry/react-router and anything else built on @sentry/node) do not instrument the global `fetch`: Deno's `fetch` is not undici, so it emits none of the diagnostics channels the NodeFetch integration listens on, and outgoing requests made with it get no `http.client` span and no `sentry-trace`/`baggage` headers even with `nativeNodeFetchIntegration({ spans: true })` set explicitly — use `node:http`, or import `fetch` from the `undici` package (both are instrumented normally), or register a fetch integration built on `addFetchInstrumentationHandler` + `instrumentFetchRequest` from `@sentry/core`.
