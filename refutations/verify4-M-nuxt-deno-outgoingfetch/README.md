# verify4-M-nuxt-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-nuxt-deno` (see `$REPRO/cells/M-nuxt-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.sh`, `RERUN2.sh`, `app-b-custom-static.log`, `app-b-none-static.log`, `app-c-custom-stream.log`, `app-c-edge-stream.log`, `app-cf-static.log`, `app-cf-stream.log`, `app-custom-static.log`, `app-none-static.log`, `app-stream-base.log`, `app-stream-fix.log`, `app.pid`, `appfix.pid`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `global-fetch-integration.ts`, `install.log`, `install2.log`, `nuxt.config.ts`, `package-lock.json`, `package.json`, `pid-A`, `pid-B`, `pid-C`, `pid-D`, `pid-E`, `pid-b-custom-static`, `pid-b-none-static`, `pid-c-custom-stream`, `pid-c-edge-stream`, `pid-cf-static`, `pid-cf-stream`, `pid-custom-static`, `pid-none-static`, `pid-rec-r2`, `pid-rec-r2b`, `pid-sink-r2`, `r2-A-none-static.log`, `r2-B-edge-static.log`, `r2-C-edge-stream.log`, `r2-D-custom-stream.log`, `r2-E-node-none-stream.log`, `rec-r2.log`, `rec-r2b.log`, `rec.log`, `rec.pid`, `recorder.mjs`, `sentry.server.config.ts`, `server/`, `sink-r2.log`, `sink.log`, `sink.mjs`, `sink.pid`, `uninstall.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Reproduced the report exactly with the documented wiring, then refuted the "impossible" half: a ~20-line userland integration built only from `@sentry/core` exports restores both the `http.client` span and the propagation headers, on the same Nuxt/nitro `deno_server` build.

Setup (unchanged from the original probe, rebuilt and rerun): Nuxt 4.5.2 (nitro 2.13.4), `@sentry/nuxt` 10.67.0 (develop 6f2da7483d), deno 2.9.0, `nitro: { preset: 'deno_server' }`, `autoInjectServerSentry: 'top-level-import'`, sink 28841 / recorder 28842 / app 28845. Four probe routes: `/api/fetchout` (global `fetch`), `/api/fetchout-ofetch` (nitro `$fetch`), `/api/fetchout-nodehttp` (`node:http.request`), `/api/fetchout-inspan` (global `fetch` inside `Sentry.startSpan`). The e2e reference `~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/nuxt-3-top-level-import` uses exactly this wiring (`autoInjectServerSentry: 'top-level-import'`, `traceLifecycle: 'static'`, `node .output/server/index.mjs`) and adds nothing for fetch, so there is no further documented knob to try.

RUN A - baseline, `SENTRY_FETCH_FIX=none`, `LIFECYCLE=static` (r2-A-none-static.log). Confirms the report:
  recorder: [{"url":"/rec-globalfetch","sentryTrace":null,"baggage":null,"traceparent":null},{"url":"/rec-ofetch","sentryTrace":null,"baggage":null,"traceparent":null},{"url":"/rec-nodehttp","sentryTrace":"aec187d30ae94e43af67bff2701586f6-aacaff601ba5b947","baggage":"sentry-environment=production,...","traceparent":null},{"url":"/rec-inspan","sentryTrace":null,"baggage":null,"traceparent":null}]
  sink: {"type":"transaction","name":"manual-root-fetch","op":"probe.manual","source":"custom","status":"ok","sdk":"sentry.javascript.nuxt","spans":[]}
  So global `fetch` gets no span and no headers even *inside* an active span; `$fetch`/ofetch is identical (it is global fetch); only `node:http.request` is instrumented (headers added by `@sentry/instrumentation-http`).

RUN C - `winterCGFetchIntegration()` from `@sentry/vercel-edge`, default `LIFECYCLE=stream` (r2-C-edge-stream.log). FIXED:
  sink: {"type":"span","trace_id":"3b3f29ef125344d3872958dddc853716","items":["http.client GET 127.0.0.1","http.client GET 127.0.0.1","http.client GET 127.0.0.1","probe.manual manual-root-fetch"],"raw":[{"name":"GET 127.0.0.1","status":"ok","is_segment":true,"origin":"auto.http.wintercg_fetch"},{"name":"GET 127.0.0.1","status":"ok","is_segment":true,"origin":"auto.http.wintercg_fetch"},{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"96d9a6520bba5f0d","is_segment":false,"origin":"auto.http.wintercg_fetch"},{"name":"manual-root-fetch","status":"ok","is_segment":true,"origin":"manual"}]}
  recorder: {"url":"/rec-globalfetch","sentryTrace":"3b3f29ef125344d3872958dddc853716-aa0bc0ff5b6161d9-1","baggage":"...sentry-trace_id=3b3f29ef125344d3872958dddc853716,sentry-transaction=GET%20127.0.0.1,sentry-sampled=true,sentry-sample_rate=1"} and the same for /rec-ofetch and /rec-inspan.

RUN D - the same with a hand-written integration that imports nothing but `@sentry/core` (`global-fetch-integration.ts`: `addFetchInstrumentationHandler` + `instrumentFetchRequest` + `shouldPropagateTraceForUrl`), `LIFECYCLE=stream` (r2-D-custom-stream.log). Identical result, only the origin differs:
  {"type":"span","trace_id":"b1cf507163634ed1a9da0016c9fc48f3","items":["http.client GET 127.0.0.1","http.client GET 127.0.0.1","http.client GET 127.0.0.1","probe.manual manual-root-fetch"],"raw":[{"name":"GET 127.0.0.1","is_segment":true,"origin":"auto.http.fetch"},{"name":"GET 127.0.0.1","is_segment":true,"origin":"auto.http.fetch"},{"name":"GET 127.0.0.1","parent_span_id":"b5e867ec400990ce","is_segment":false,"origin":"auto.http.fetch"},{"name":"manual-root-fetch","is_segment":true,"origin":"manual"}]}

RUN B - the fix under `LIFECYCLE=static` (r2-B-edge-static.log). Headers work, spans only partly: the `http.client` child of an explicit `Sentry.startSpan` is emitted ({"type":"transaction","name":"manual-root-fetch",...,"spans":["http.client GET http://127.0.0.1:28842/rec-inspan"]}), but the three parentless ones are dropped: `Sentry Logger [log]: Sending outcomes: [ { reason: "no_parent_span", category: "span", quantity: 3 } ]`. This is `packages/core/src/fetch.ts:104-117` - `shouldEmitSpan = hasParent || hasSpanStreamingEnabled(client)`. Nuxt-on-Deno has no server span at all (the separate route-names finding), so under `static` there is nothing to parent a top-level fetch to. Under the develop default `stream` this does not matter.

Root cause: nothing in the Node-side default integration set instruments a non-undici global `fetch`. `nativeNodeFetchIntegration` (`packages/node/src/integrations/node-fetch/index.ts`) only subscribes to undici diagnostics channels, which Deno's Rust-native `fetch` never emits, and `@sentry/deno`'s own default set (`packages/deno/src/sdk.ts:29-47`: denoServe, denoHttp, breadcrumbs, ...) has no global-fetch integration either. The `@sentry/core` fetch primitives that the browser, Cloudflare and vercel-edge SDKs use work perfectly on Deno - they are simply never wired up on the server side. So this is a missing integration, not a runtime limitation, and finding K2 is fixable in the SDK.

Cross-check under node was not possible: the `deno_server` output emits `npm:` specifiers and `node .output/server/index.mjs` dies with `ERR_UNSUPPORTED_ESM_URL_SCHEME ... Received protocol 'npm:'`.

Probe files (all absolute): $SCRATCH/deep/verify4-M-nuxt-deno-outgoingfetch/ - RERUN2.sh (exact commands), sentry.server.config.ts (SENTRY_FETCH_FIX=none|custom|edge, LIFECYCLE=stream|static), global-fetch-integration.ts, server/api/fetchout*.get.ts, sink.mjs, recorder.mjs, r2-A-none-static.log, r2-B-edge-static.log, r2-C-edge-stream.log, r2-D-custom-stream.log, r2-E-node-none-stream.log.

## Workaround

Add a global-fetch integration to `sentry.server.config.ts`. Either `integrations: [winterCGFetchIntegration()]` imported from `@sentry/vercel-edge` (extra dependency, span origin `auto.http.wintercg_fetch`), or, with no new dependency, a small integration on top of `@sentry/core`:

import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl } from '@sentry/core';
export const globalFetchIntegration = defineIntegration(() => {
  const spans: Record<string, any> = {};
  const headersUrlMap = new LRUMap<string, boolean>(100);
  return { name: 'GlobalFetch', setupOnce() { addFetchInstrumentationHandler(handlerData => {
    const client = getClient();
    if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
    instrumentFetchRequest(handlerData, () => true, url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap), spans, { spanOrigin: 'auto.http.fetch' });
  }); } };
});

Then `Sentry.init({ ..., integrations: [globalFetchIntegration()] })`. Keep the develop default `traceLifecycle: 'stream'`; with `traceLifecycle: 'static'` the headers still get attached but a fetch that is not inside an explicit `Sentry.startSpan` is dropped with `no_parent_span`, because Nuxt-on-Deno produces no server span to parent it to. This covers nitro's `$fetch`/ofetch too, since ofetch calls global `fetch`.

## Docs impact

On the Nuxt (and Deno) guide: "On Deno the SDK does not instrument the global `fetch`, so calls made with `fetch` or nitro's `$fetch` produce no `http.client` span and carry no `sentry-trace`/`baggage` headers; only `node:http` requests are traced. Until the SDK ships a global-fetch integration for this runtime, add one in `sentry.server.config.ts` (`winterCGFetchIntegration()` from `@sentry/vercel-edge`, or a small `addFetchInstrumentationHandler` + `instrumentFetchRequest` integration from `@sentry/core`), and keep `traceLifecycle: 'stream'` - under `traceLifecycle: 'static'` a fetch outside an explicit `Sentry.startSpan` is still dropped, because Nuxt on Deno has no server span to parent it to."
