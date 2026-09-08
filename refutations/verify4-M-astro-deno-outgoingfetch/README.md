# verify4-M-astro-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-astro-deno` (see `$REPRO/cells/M-astro-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.md`, `app-base.log`, `app-cf.log`, `app-custom-stream.log`, `app-stream.log`, `app-v2-base.log`, `app-v2-cf.log`, `app-v2-custom-stream.log`, `app.pid`, `astro.config.mjs`, `build1.log`, `build2.log`, `dc-probe.mjs`, `deno.json`, `deno.lock`, `fetch-integration.js`, `install.log`, `install2.log`, `package-lock.json`, `package.json`, `rec-v2.log`, `rec.log`, `rec.mjs`, `rec.pid`, `sentry.server.config.js`, `sink-v2.log`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Confirmed broken as reported, and I found the root cause plus a fully working user-side fix (see workaround), so nothing in the documented Astro/Deno wiring refutes it.

Probe: $SCRATCH/deep/verify4-M-astro-deno-outgoingfetch/ (Astro 7.3.1 output:'server' + @deno/astro-adapter 0.6.0 + @sentry/astro 10.67.0 develop, deno 2.9.0, built dist/server/entry.mjs). Full recipe in RERUN.md; logs app-v2-base.log / app-v2-cf.log / app-v2-custom-stream.log.

Commands:
  npm install --no-audit --no-fund
  PORT=53821 node sink.mjs &   PORT=53822 node rec.mjs &
  SINK_PORT=53821 REC_PORT=53822 LIFECYCLE=static [FETCH_FIX=cloudflare|custom] \
    deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-run dist/server/entry.mjs
  curl :53823/ ; curl :53823/outfetch ; curl :53823/outhttp ; curl :53823/sentinel
  curl :53821/__items ; curl :53822/__hits

1) BASELINE, stock wiring, traceLifecycle 'static' (broken, matches the report verbatim):
{"type":"transaction","name":"GET /outfetch","op":"http.server","source":"route","status":"ok","trace_id":"672c185045bb409393cc084fc369f106","sdk":"sentry.javascript.astro","spans":[]}
{"type":"transaction","name":"GET /outhttp","op":"http.server","source":"route","status":"ok","trace_id":"e6005df74f8642a2a2aaa5c4b2fa4830","sdk":"sentry.javascript.astro","spans":["http.client GET http://127.0.0.1:53822/rec"]}
recorder hits:
  {"url":"/rec?via=fetch","sentryTrace":null,"baggage":null}
  {"url":"/rec?via=http","sentryTrace":"e6005df74f8642a2a2aaa5c4b2fa4830-92b4788a85970d32-1","baggage":"sentry-environment=production,...,sentry-transaction=GET%20%2Fouthttp,sentry-sampled=true,..."}

2) Things that do NOT change it: the other trace lifecycle (stream produces the same fetch-less span envelope), the documented Astro integration wiring, sourcemaps on/off, the src/middleware.ts init placement, node:http on the same process (always works). No bundler or Deno flag variant matters because the failure is below the SDK.

3) ROOT CAUSE (dc-probe.mjs, run under deno 2.9.0):
  after global fetch, channels fired: []
  after node:http get, channels fired: ["http.client.request.created","http.client.request.start","http.client.response.finish"]
Deno's global fetch publishes no node:diagnostics_channel events at all (neither "undici:request:*" nor "http.client.*"). @sentry/node's only outgoing-fetch path is the vendored undici diagnostics_channel instrumentation (packages/node/src/integrations/node-fetch/undici-instrumentation.ts, shipped as nativeNodeFetchIntegration), so it can never observe Deno's fetch. Export check on the installed builds: @sentry/node and @sentry/astro expose only `nativeNodeFetchIntegration`; a globalThis.fetch-patching `fetchIntegration` exists only in @sentry/bun (packages/bun/src/integrations/fetch.ts) and @sentry/cloudflare (packages/cloudflare/src/integrations/fetch.ts), plus `winterCGFetchIntegration` in @sentry/vercel-edge. @sentry/deno ships none. That asymmetry, not Astro, is the gap.

4) The repo's own e2e app agrees: ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts asserts only the hand-written `Sentry.startSpan({name:'test-outgoing-fetch'})` wrapper (`origin: 'manual'`) and never an `http.client` span, so the Deno suite does not cover automatic fetch instrumentation. astro-7 (the Astro reference app) runs on @astrojs/node, not Deno, so it never exercises this.

5) With a fetch integration added, the capability works completely (both lifecycles), which proves the runtime can support it and the only missing piece is SDK-shipped code:
  FETCH_FIX=cloudflare, static:
  {"type":"transaction","name":"GET /outfetch","op":"http.server","source":"route","status":"ok","trace_id":"87e311391b7b4e73bcd852eaeb4155d6","spans":["http.client GET http://127.0.0.1:53822/rec"]}
  {"url":"/rec?via=fetch","sentryTrace":"87e311391b7b4e73bcd852eaeb4155d6-9948eb2f76ac150b-1","baggage":"...sentry-trace_id=87e311391b7b4e73bcd852eaeb4155d6,sentry-transaction=GET%20%2Foutfetch,sentry-sampled=true,sentry-sample_rate=1"}
  FETCH_FIX=custom, stream:
  {"type":"span","trace_id":"a26095c579e649eeb43ecb3e73d1507e","items":["http.client GET 127.0.0.1","http.server GET /outfetch"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"a5a58ddf030a4cf2","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET /outfetch","status":"ok","is_segment":true,"origin":"auto.http.astro"}]}
  {"url":"/rec?via=fetch","sentryTrace":"a26095c579e649eeb43ecb3e73d1507e-b98ee9403a04bf8b-1","baggage":"...sentry-transaction=GET%20%2Foutfetch,sentry-sampled=true,..."}

Side note reconfirmed: without src/middleware.ts importing sentry.server.config.js first, Sentry.init never runs for requests that only hit .ts/.js endpoint routes; the .astro page injection path is what warms it otherwise.

## Workaround

Two, both verified end to end (span with correct parent + `sentry-trace` and `baggage` on the wire), on both traceLifecycle 'static' and 'stream'.

A) Write a ~20-line integration from public @sentry/core exports (preferred; no cross-runtime package). File fetch-integration.js next to sentry.server.config.js:

  import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest,
           isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl } from '@sentry/core';
  export const denoFetchIntegration = defineIntegration(() => {
    const headersUrlMap = new LRUMap(100);
    const spans = {};
    return { name: 'DenoFetch', setupOnce() {
      addFetchInstrumentationHandler(handlerData => {
        const client = getClient();
        if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
        instrumentFetchRequest(handlerData, () => true,
          url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
          spans, { spanOrigin: 'auto.http.fetch' });
      });
    }};
  });

then in sentry.server.config.js: `integrations: [denoFetchIntegration()]`. All seven core exports are present in the shipped @sentry/core 10.67.0 build. Produces `http.client` with origin `auto.http.fetch`.

B) One-liner, if pulling an extra package is acceptable: `import { fetchIntegration } from '@sentry/cloudflare';` and `integrations: [fetchIntegration()]`. It is pure globalThis.fetch patching with no Workers-only APIs, so it loads and runs fine under Deno inside the Astro server bundle. Same span and headers, plus fetch breadcrumbs.

C) If you only need the trace to continue and not the span: use `node:http`/`node:https` for the outgoing call (fully instrumented on Deno, verified in every run), or wrap the fetch in `Sentry.startSpan(...)` and attach headers from `Sentry.getTraceData()` yourself, which is what the repo's own deno e2e test does.

Real fix belongs in the SDK: port the `fetchIntegration` that @sentry/bun and @sentry/cloudflare already have into @sentry/deno, and/or have @sentry/node fall back to globalThis.fetch patching when the undici diagnostics channels never fire.

## Docs impact

On Deno, `@sentry/node` (and therefore `@sentry/astro`, `@sentry/nuxt`, `@sentry/sveltekit` and every other Node-based framework SDK running on a Deno adapter) cannot instrument the global `fetch()`, because Deno's `fetch` emits none of the `node:diagnostics_channel` events the SDK's `nativeNodeFetchIntegration` subscribes to: outgoing `fetch` calls get no `http.client` span and no `sentry-trace`/`baggage` headers, so the trace stops at your server; use `node:http`/`node:https` instead, or add a `globalThis.fetch`-patching integration built on `addFetchInstrumentationHandler` + `instrumentFetchRequest` from `@sentry/core` (the same one `@sentry/bun` and `@sentry/cloudflare` ship as `fetchIntegration`), which restores both the span and the propagation headers. The same page must also state that on a Deno adapter you need a `src/middleware.ts` whose first line is `import '../sentry.server.config.js';`, otherwise `Sentry.init` never runs for requests that only hit `.ts`/`.js` endpoint routes.
