# verify4-M-fresh-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) from a Fresh 2 route handler on Deno with @sentry/deno 10.67.0 (develop)** of cell `M-fresh-deno` (see `$REPRO/cells/M-fresh-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build.log`, `dev1.log`, `dev2.log`, `dev3.log`, `init.log`, `pids.txt`, `prod1.log`, `prod2.log`, `rec.log`, `rec.mjs`, `run-b/`, `sdkdeps/`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced exactly, and it is a @sentry/deno gap (K2), not a Fresh gap. Probe dir: $SCRATCH/deep/verify4-M-fresh-deno-outgoingfetch (Fresh 2.3.3 + @fresh/plugin-vite 1.1.2, deno 2.9.0, SDK from $REPRO/_toolbox/pack tarballs copied into app/node_modules). Two routes call out to a node:http recorder in the same request: /api/out uses global `fetch()`, /api/outnode uses `node:http.request()`. Driver: /run-b/drive.sh (sink 58101, recorder 58103, app 58105).

A) vite dev, traceLifecycle static, stock SDK (no extra integration):
  transaction | GET /api/out | op=http.server | src=route | spans=[]
  transaction | GET /api/outnode | op=http.server | src=route | spans=["http.client GET http://127.0.0.1:58103/__rec"]
  REC: [{"url":"/__rec?via=fetch","sentry-trace":null,"baggage":null,"traceparent":null},
        {"url":"/__rec?via=nodehttp","sentry-trace":"99f997b2...-a15eefd75fd6ddc5-1","baggage":"sentry-environment=production,...,sentry-transaction=GET%20%2Fapi%2Foutnode,sentry-sampled=true,..."}]

D) production build (`deno task build` then `deno serve -A --port 58105 _fresh/server.js`), static, stock SDK, same result:
  transaction | GET /api/out | op=http.server | src=route | spans=[]
  transaction | GET /api/outnode | op=http.server | src=route | spans=["http.client GET http://127.0.0.1:58103/__rec"]
  REC: [{"url":"/__rec?via=fetch","sentry-trace":null,"baggage":null,...}, {"url":"/__rec?via=nodehttp","sentry-trace":"b6219c48...-a725b91224d50651-1",...}]

So the only thing that fails is the global `fetch()`; `node:http` clients in the very same handler get an http.client span and both headers. Neither init placement, entry shape, nor lifecycle changes this: I tested vite dev and the bundled `_fresh/server.js`, and traceLifecycle static and stream. No variant of the framework wiring can fix it, because nothing in the request path is involved.

Root cause, verified in the source rather than guessed: `@sentry/deno` has no fetch tracing integration at all. Its default integration list (packages/deno/src/sdk.ts getDefaultIntegrations) contains denoServeIntegration + denoHttpIntegration, and denoHttpIntegration (packages/deno/src/integrations/http.ts) subscribes only to the `node:http` diagnostics channels (getHttpClientSubscriptions / HTTP_ON_CLIENT_REQUEST), which Deno's native `fetch` never goes through. Nothing named `fetchIntegration` is exported from packages/deno/src/index.ts. Notably the monkey-patch itself works fine on Deno: the default `breadcrumbsIntegration` (packages/deno/src/integrations/breadcrumbs.ts:47) already calls `addFetchInstrumentationHandler` for fetch breadcrumbs. What is missing is a handler that calls `instrumentFetchRequest`, i.e. exactly the file `@sentry/cloudflare` already ships at packages/cloudflare/src/integrations/fetch.ts.

I proved that by porting it into user land and re-running the same probe (app/fetch-tracing.ts, enabled by SENTRY_FETCH_TRACING=1):

B2) vite dev, static, with the integration:
  transaction | GET /api/out | op=http.server | src=route | spans=["http.client GET http://127.0.0.1:58103/__rec"]
  REC: [{"url":"/__rec?via=fetch","sentry-trace":"c63d512111a8494fb8d0d3bf177b62d0-a23f474f5c9a1061-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=c63d512111a8494fb8d0d3bf177b62d0,sentry-transaction=GET%20%2Fapi%2Fout,sentry-sampled=true,sentry-sample_rate=1",...}]

C) vite dev, traceLifecycle stream, with the integration:
  span | ["http.client GET 127.0.0.1","http.server GET /api/out"]

E) production build (`deno serve _fresh/server.js`), static, with the integration:
  transaction | GET /api/out | op=http.server | src=route | spans=["http.client GET http://127.0.0.1:58103/__rec"]
  REC: [{"url":"/__rec?via=fetch","sentry-trace":"da5b6e985cf2498bb56030cb5e62c25d-9e6ddd7760f6588e-1","baggage":"...sentry-transaction=GET%20%2Fapi%2Fout,sentry-sampled=true,..."}]

Because a ~20-line user-land integration using only publicly exported `@sentry/core` APIs restores the span, the correct parent/child nesting and both headers in every shape, the gap is purely a missing default integration in `@sentry/deno`, not a Deno platform limitation. I did not exercise Deno's native `--unstable-otel` fetch instrumentation: it exports through Deno's own OTLP pipeline and shares no trace context with the Sentry SDK, so it cannot produce a child of the Sentry server span.

Repro: `cd app && SENTRY_TUNNEL=http://127.0.0.1:58101/ REC_URL=http://127.0.0.1:58103 SENTRY_LIFECYCLE=static SENTRY_FETCH_TRACING=0|1 deno task dev --port 58105`, then `curl /api/out /api/outnode /api/sentinel`. Logs in run-b/*.server.log; all servers I started are killed.

## Workaround

Register a user-land fetch tracing integration; it is a straight port of packages/cloudflare/src/integrations/fetch.ts and needs `"@sentry/core": "npm:@sentry/core@10.67.0"` in the deno.json import map. app/fetch-tracing.ts:

import type { Span } from "@sentry/core";
import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl } from "@sentry/core";
const spans: Record<string, Span> = {};
export const fetchTracingIntegration = defineIntegration(() => ({
  name: "FetchTracing",
  setup() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient();
      if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true, () => true, spans, { spanOrigin: "auto.http.deno.fetch" });
    });
  },
}));

then `Sentry.init({ ..., integrations: [fetchTracingIntegration()] })` in instrument.ts. The `isSentryRequestUrl` guard is required, otherwise the SDK's own envelope requests get spans. Verified in vite dev and in the `deno serve _fresh/server.js` build, under both traceLifecycle static and stream. Alternative with no SDK-internal APIs: call the service with `node:http`/`node:https` instead of `fetch`, which denoHttpIntegration already instruments end to end (span + sentry-trace + baggage), as run A shows.

## Docs impact

On the Deno platform page (docs/platforms/javascript/guides/deno/), state plainly: "The Deno SDK does not create `http.client` spans for, or attach `sentry-trace`/`baggage` headers to, requests made with the global `fetch()`; only `node:http`/`node:https` clients are instrumented, so a downstream service called with `fetch()` starts a new, disconnected trace." The same page's `breadcrumbs` integration doc (deno/configuration/integrations/breadcrumbs.mdx:23) already advertises fetch support for breadcrumbs, so the tracing exception has to be called out explicitly next to it, together with the user-land `instrumentFetchRequest` integration snippet as the interim workaround. Any Fresh/Deno framework guide should point at that Deno-level note rather than describing it as a framework limitation.
