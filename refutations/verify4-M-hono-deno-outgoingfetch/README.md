# verify4-M-hono-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (Hono 4.13.7 on Deno 2.9.0, `@sentry/hono/deno` 10.67.0 / develop)** of cell `M-hono-deno` (see `$REPRO/cells/M-hono-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-baseline-static.log`, `app-fetchfix-static.log`, `app-fetchfix-stream-nohook.log`, `app-fix-nohook.log`, `app-fix-static.log`, `app-fix-stream.log`, `app-static.log`, `app-stream.log`, `app-wintercg-static.log`, `app.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `appfix.pid`, `deno.json`, `fetch-integration.ts`, `main-fix-nohook.ts`, `main-fix.ts`, `main-nohook.ts`, `main.ts`, `package-lock.json`, `package.json`, `rec.log`, `rec.pid`, `recorder.mjs`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced exactly, in both lifecycles, with and without the `@sentry/deno/import` hook. Nothing in the documented wiring changes it, and I found the root cause in the SDK source.

Probe dir: `$SCRATCH/deep/verify4-M-hono-deno-outgoingfetch/`
Files: `main.ts` (baseline), `main-fix.ts` (baseline + userland fetch integration), `main-fix-nohook.ts`, `fetch-integration.ts` (the workaround), `sink.mjs` (sink extended with a `/rec` header recorder + `/__recs`), `deno.json` (`{"nodeModulesDir":"manual"}`), logs `app-*.log`. `node_modules` removed after the run.

Install / run (ports 41317 sink, 41318-41322 app):
  npm install $REPRO/_toolbox/pack/sentry-{deno,hono,core,server-utils,server-runtime-injection}-10.67.0.tgz hono@4
  PORT=41317 node sink.mjs &
  SINK_PORT=41317 APP_PORT=41318 LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts

BASELINE, static lifecycle, hook ON — `/downstream` does a global `fetch()`, `/downstream-http` does `node:http` `http.get` to the same recorder:
  {"type":"transaction","name":"GET /downstream","op":"http.server","status":"ok","trace_id":"23a1999bd99842cfb73ae08d3f3881ae","sdk":"sentry.javascript.hono","spans":[]}
  {"type":"transaction","name":"GET /downstream-http","op":"http.server","status":"ok","trace_id":"ca0f39734f634e4db72cd65a76768175","sdk":"sentry.javascript.hono","spans":["http.client GET http://127.0.0.1:41317/rec/downstream-http"]}
  recorder: {"url":"/rec/downstream-fetch","sentryTrace":null,"baggage":null,"traceparent":null}
  recorder: {"url":"/rec/downstream-http","sentryTrace":"ca0f39734f634e4db72cd65a76768175-b5266e2c39e172fc-1","baggage":"sentry-environment=production,...,sentry-trace_id=ca0f39734f634e4db72cd65a76768175,..."}

BASELINE, stream lifecycle — same split:
  {"type":"span","trace_id":"38fb771349bc4e19b0e01226b6591314","items":["http.server GET /downstream"]}
  {"type":"span","trace_id":"c2a4cb01909a4d3ebae4a2d0fc88436e","items":["http.client GET 127.0.0.1","http.server GET /downstream-http"]}
  recorder: {"url":"/rec/downstream-fetch","sentryTrace":null,"baggage":null}

ROOT CAUSE (not a Deno platform limitation): `@sentry/deno` ships no fetch integration. `packages/deno/src/sdk.ts` `getDefaultIntegrations()` lists `denoHttpIntegration()` (which is `node:http`/`node:https` diagnostics-channel only) and never anything that calls `instrumentFetchRequest`. Grepping the built package confirms it: `@sentry/deno/build/esm/index.js` contains `denoHttpIntegration` and no `fetchIntegration`. `@sentry/cloudflare` has exactly the missing piece at `packages/cloudflare/src/integrations/fetch.ts` (`fetchIntegration`), and it is not ported to Deno. `@sentry/hono/deno` only re-exports `@sentry/deno`, so Hono adds nothing here — the gap is in the Deno SDK.

Global `fetch` IS already patched in a Deno Sentry process: `packages/deno/src/integrations/breadcrumbs.ts` calls `addFetchInstrumentationHandler` by default. So the instrumentation hook fires; there is simply no subscriber that starts a span or injects headers.

The repo's own e2e app confirms this is uncovered, not merely undocumented: `dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts` wraps the outgoing `fetch` in a MANUAL `Sentry.startSpan({ name: 'test-outgoing-fetch' })` (see `src/app.ts:134`) and asserts only on that manual span with `origin: 'manual'` — it never asserts an `http.client` span or propagated headers. There is no Hono-on-Deno e2e app at all (`test-applications/` has `deno`, `deno-mysql`, `deno-pg`, `deno-redis`, `deno-streamed`, and `hono-4`, which is Node).

Variants tried, all still broken at baseline: `traceLifecycle: 'static'` and `'stream'`; hook ON (`import "@sentry/deno/import"` first line) and hook OFF; init inside the Hono `sentry(app, {...})` middleware (the documented shape). No bundler variant is relevant here since the failure is a missing integration, not a transform.

## Workaround

A userland integration built from `@sentry/core` primitives fully restores both the span and the headers — verified in static AND stream lifecycle, and with the import hook both on and off. Add `@sentry/core` as a direct dependency and register it in `sentry(app, { integrations: [denoFetchIntegration()] })`:

```ts
// fetch-integration.ts
import {
  addFetchInstrumentationHandler, defineIntegration, getClient,
  instrumentFetchRequest, isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl,
} from '@sentry/core';

export const denoFetchIntegration = defineIntegration(() => {
  const headersUrlMap = new LRUMap<string, boolean>(100);
  const spans: Record<string, any> = {};
  return {
    name: 'DenoFetch',
    setupOnce() {
      addFetchInstrumentationHandler(handlerData => {
        const client = getClient();
        if (!client) return;
        if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
        instrumentFetchRequest(
          handlerData,
          () => true,
          url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
          spans,
          { spanOrigin: 'auto.http.fetch' },
        );
      });
    },
  };
});
```

Result with it (static, `main-fix.ts`):
  {"type":"transaction","name":"GET /downstream","op":"http.server","status":"ok","trace_id":"4ec23075c1284c8c98ad49db20174b18","spans":["http.client GET http://127.0.0.1:41317/rec/downstream-fetch"]}
  recorder: {"url":"/rec/downstream-fetch","sentryTrace":"4ec23075c1284c8c98ad49db20174b18-80e133679aef7cee-1","baggage":"sentry-environment=production,...,sentry-trace_id=4ec23075c1284c8c98ad49db20174b18,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,..."}
And stream (`main-fix.ts`, LIFECYCLE=stream):
  {"type":"span","trace_id":"17d8ae5e8891424897974a5df0262a5d","items":["http.client GET 127.0.0.1","http.server GET /downstream"],"raw":[{"name":"GET 127.0.0.1","parent_span_id":"ab81b942d9df6f9d","origin":"auto.http.fetch"},...]}

Because it works verbatim, the real fix is to port `packages/cloudflare/src/integrations/fetch.ts` into `packages/deno` and add it to `getDefaultIntegrations()` in `packages/deno/src/sdk.ts`.

Simpler stopgap if you only need one call traced: wrap it in `Sentry.startSpan({ name: 'GET /thing', op: 'http.client' }, ...)` and inject headers yourself with `Sentry.getTraceData()` — this is what the repo's own Deno e2e test does. Note that a manual span alone does NOT propagate headers; the recorder still saw no `sentry-trace`.

## Docs impact

On the Hono (Deno tab) and Deno guides, under tracing/distributed tracing: "On Deno, outgoing requests made with the global `fetch()` are not instrumented: they produce no `http.client` span and receive no `sentry-trace` or `baggage` header, so the downstream service starts a new trace. Only `node:http` / `node:https` clients are traced automatically, via `denoHttpIntegration`. To trace a `fetch()` call, either use a `node:http` client instead, or wrap the call in `Sentry.startSpan({ name: '<method> <route>', op: 'http.client' }, ...)` and attach the headers yourself with `Sentry.getTraceData()` — a manual span on its own does not propagate the trace."
