# verify4-M-fastify-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-fastify-deno` (see `$REPRO/cells/M-fastify-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-a.log`, `app-b.log`, `app-c.log`, `check-cf.ts`, `deno.json`, `instrument.ts`, `main.ts`, `package-lock.json`, `package.json`, `pids.txt`, `recorder.log`, `recorder.mjs`, `run-b/`, `sentry-fetch-integration.ts`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The default is broken exactly as reported, but the capability is NOT unreachable: one line in `Sentry.init({ integrations: [...] })` gives a full `http.client` span plus `sentry-trace`/`baggage` on a global `fetch()` from a Fastify handler, in both lifecycles. Fastify is irrelevant to the whole thing; this is a plain `@sentry/deno` gap.

ROOT CAUSE (read from the develop source, not guessed): `@sentry/deno` ships NO fetch tracing integration. `packages/deno/src/sdk.ts:29-49` `getDefaultIntegrations()` lists `breadcrumbsIntegration()`, `denoServeIntegration()`, `denoHttpIntegration()`, ... and nothing that creates client spans for global `fetch`. `packages/deno/src/index.ts` exports no `fetchIntegration`/`winterCGFetchIntegration`. The fetch wrapper itself IS installed on Deno (`packages/deno/src/integrations/breadcrumbs.ts:48` calls `addFetchInstrumentationHandler`), it is only ever used for breadcrumbs. `@sentry/cloudflare` (`src/integrations/fetch.ts`, in its defaults at `src/baseSdk.ts:60`) and `@sentry/vercel-edge` (`src/integrations/wintercg-fetch.ts`) both have the missing piece; `@sentry/deno` never got it.

The repo's own reference app agrees this is a known gap: `dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts` is named "Outbound fetch inside Sentry span creates transaction" and asserts only the hand-written `Sentry.startSpan({name:'test-outgoing-fetch'})` wrapper with `origin: 'manual'`. No test anywhere asserts an `http.client` span or a propagated header for a Deno `fetch`.

A) BASELINE, REPRODUCED (Fastify 5.6.1 on Deno 2.9.0, @sentry/deno 10.67.0, `traceLifecycle:'static'`, no integrations) — recorder saw:
  {"url": "/downstream-fetch", "via": "global-fetch", "sentry-trace": null, "baggage": null, "traceparent": null}
  {"url": "/downstream-nodehttp", "via": "node-http", "sentry-trace": "408b4a4cc94d47a297eb379980467692-ba9ab9760e683345-1", "baggage": "sentry-environment=production,...,sentry-transaction=GET%20%2Fnodehttp,sentry-sampled=true,..."}
sink:
  {"type":"transaction","name":"GET /fetch","op":"http.server","source":"route","status":"ok","spans":["handler GET /fetch","handler fastify - route-handler"]}
  {"type":"transaction","name":"GET /nodehttp","op":"http.server","source":"route","status":"ok","spans":["handler GET /nodehttp","handler fastify - route-handler","http.client GET http://127.0.0.1:41872/downstream-nodehttp"]}
Same in `traceLifecycle:'stream'`:
  {"type":"span","items":["handler /fetch","handler /fetch","http.server GET /fetch"]}   <- no http.client

B) FIX 1, a SHIPPED Sentry integration, zero user code (`VARIANT=wintercg`, `traceLifecycle:'static'`): `import { winterCGFetchIntegration } from "@sentry/vercel-edge"` and pass `integrations: [winterCGFetchIntegration()]` to the Deno `Sentry.init`. It runs unmodified under Deno:
  {"url": "/downstream-fetch", "via": "global-fetch", "sentry-trace": "0b00717195da444987c0a8990af8e976-b2e77c2afd71b122-1", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=0b00717195da444987c0a8990af8e976,sentry-transaction=GET%20%2Ffetch,sentry-sampled=true,sentry-sample_rand=0.3710628730989548,sentry-sample_rate=1"}
  {"type":"transaction","name":"GET /fetch","op":"http.server","source":"route","status":"ok","spans":["handler GET /fetch","handler fastify - route-handler","http.client GET http://127.0.0.1:41872/downstream-fetch"]}
This is the decisive result: the SDK code that fixes this already exists and needs only to be exported from, and defaulted in, `@sentry/deno`. It is not a Deno platform limitation.

C) FIX 2, a ~25-line user-land integration built only from public `@sentry/core` exports (`addFetchInstrumentationHandler`, `instrumentFetchRequest`, `isSentryRequestUrl`, `shouldPropagateTraceForUrl`, `LRUMap`, `defineIntegration`) — avoids depending on `@sentry/vercel-edge`. `traceLifecycle:'static'`:
  {"url": "/downstream-fetch", "via": "global-fetch", "sentry-trace": "fd5dea1d9bb241ff972a772023fc5295-af78cd2e36dee448-1", "baggage": "...sentry-transaction=GET%20%2Ffetch,sentry-sampled=true..."}
  {"type":"transaction","name":"GET /fetch","op":"http.server","source":"route","status":"ok","spans":["handler GET /fetch","handler fastify - route-handler","http.client GET http://127.0.0.1:41872/downstream-fetch"]}
`traceLifecycle:'stream'` (default), same integration:
  {"type":"span","trace_id":"bde4f44873d24499a5728b68be6c2330","items":["http.client GET 127.0.0.1","handler /fetch","handler /fetch","http.server GET /fetch"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"a1d0d5977655a2d4","is_segment":false,"origin":"auto.http.fetch"}, ...]}
The client span is correctly parented under the Fastify server segment and carries `origin: "auto.http.fetch"`; the stream-lifecycle name is the low-cardinality `GET 127.0.0.1`, as expected.

Notes / things I did NOT do: I did not use `@sentry/deno/import` (K3 still applies, it breaks Fastify at import), no bundler, no build step. `tracePropagationTargets: [/.*/]` was set only because the downstream host is an IP literal; it is not part of the fix. Both fixes were confirmed against the same running Fastify app, so the "Fastify does not change it" half of the original report stands.

Files (all re-runnable): $SCRATCH/deep/verify4-M-fastify-deno-outgoingfetch/run-b/ — `main.ts` (Fastify, /fetch /nodehttp /sentinel), `instrument.ts` (VARIANT=baseline|fetchint|wintercg), `fetch-integration.ts` (Fix 2), `recorder.mjs` (downstream header recorder, /__headers), `sink.mjs`, `deno.json`, `package.json`, logs `app-baseline-static.log`, `app-baseline-stream.log`, `app-fetchint-static.log`, `app-fetchint-stream2.log`, `app-wintercg-static.log`.
Rerun: `npm install $REPRO/_toolbox/pack/sentry-deno-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz $REPRO/_toolbox/pack/sentry-vercel-edge-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz fastify@5`, then `PORT=41871 node sink.mjs &`, `PORT=41872 node recorder.mjs &`, then `VARIANT=fetchint TRACE_LIFECYCLE=static SINK_PORT=41871 REC_PORT=41872 APP_PORT=41874 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts`. node_modules removed after the run.

## Workaround

Add a fetch tracing integration to `Sentry.init` in the Deno app; nothing else changes. Cheapest form, using an already-shipped Sentry integration:

```ts
import * as Sentry from "@sentry/deno";
import { winterCGFetchIntegration } from "@sentry/vercel-edge";

Sentry.init({ dsn: "...", tracesSampleRate: 1.0, integrations: [winterCGFetchIntegration()] });
```

If pulling in `@sentry/vercel-edge` is unacceptable, the same result comes from ~25 lines over public `@sentry/core` exports (verified, `fetch-integration.ts` in the probe dir):

```ts
import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest,
         isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl } from "@sentry/core";
const spans = {}; const headersUrlMap = new LRUMap(100);
export const denoFetchIntegration = defineIntegration(() => ({
  name: "DenoUserlandFetch",
  setupOnce() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient();
      if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true,
        url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
        spans, { spanOrigin: "auto.http.fetch" });
    });
  },
}));
```

Both work with and without Fastify and in both trace lifecycles. The previously reported `node:http`/`undici` escape hatch is still valid but is no longer necessary: callers can keep using global `fetch`.

SDK fix this points at: export `fetchIntegration` from `@sentry/deno` and add it to `getDefaultIntegrations()` in `packages/deno/src/sdk.ts`, reusing `packages/cloudflare/src/integrations/fetch.ts` / `packages/vercel-edge/src/integrations/wintercg-fetch.ts` (they are already byte-for-byte siblings). Then extend `dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts`, which today only asserts a `origin: 'manual'` span, to assert an `http.client` span and a propagated `sentry-trace` header.

## Docs impact

The Deno SDK does not instrument outgoing `fetch()` calls: no `http.client` span is created and no `sentry-trace`/`baggage` headers are attached, so distributed tracing stops at the Deno service — until this is fixed, either send outgoing requests through `node:http` (which is instrumented), or enable fetch tracing yourself by passing a fetch integration to `Sentry.init({ integrations: [...] })`.
