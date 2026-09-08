# verify4-M-hapi-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) from a @hapi/hapi 21.4 handler on Deno 2.9.0 with @sentry/deno on develop (10.67.0)** of cell `M-hapi-deno` (see `$REPRO/cells/M-hapi-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.md`, `app-A-baseline-static.log`, `app-B-fetchfix-static.log`, `app-C-fetchfix-stream.log`, `app-D-fetchfix-nohook-static.log`, `app-body.ts`, `app.pid`, `b-app-A-baseline-hook-static.log`, `b-app-B-fetchfix-hook-static.log`, `b-app-C-fetchfix-hook-stream.log`, `b-app-D-fetchfix-nohook-static.log`, `b-rec.log`, `b-run.log`, `b-sink.log`, `c-app.log`, `c-rec.log`, `c-run.log`, `c-sink.log`, `deno.json`, `fetch-integration.ts`, `init.ts`, `json-fix.mjs`, `main-hook.ts`, `main-nohook.ts`, `package-lock.json`, `package.json`, `pids.txt`, `rec-baseline.log`, `rec-fetchfix-static.log`, `rec-nohook-fix.log`, `recorder.mjs`, `run-b.sh`, `run-c.sh`, `sink.log`, `sink.mjs`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced exactly, and the cause is the Deno SDK, not Hapi. @sentry/deno's getDefaultIntegrations() (packages/deno/src/sdk.ts) contains no fetch tracing integration at all: denoHttpIntegration is diagnostics-channel based and only covers node:http, breadcrumbsIntegration consumes addFetchInstrumentationHandler for breadcrumbs only, and nothing in packages/deno/src/index.ts exports a fetch span integration (the only winterCGFetchIntegration in the repo lives in packages/vercel-edge).

Probe dir: $SCRATCH/deep/verify4-M-hapi-deno-outgoingfetch/ (deno.json nodeModulesDir:"manual", npm-installed @hapi/hapi, @sentry/{deno,core,server-utils,server-runtime-injection,opentelemetry} symlinked from the worktree; main-hook.ts = "@sentry/deno/import" -> ./json-fix.mjs -> ./init.ts -> ./app-body.ts; the JSON load-hook fix is required, without it Hapi still dies on @hapi/validate's require('../package.json')). Reruns: `bash run-b.sh > b-run.log 2>&1` and `bash run-c.sh > c-run.log 2>&1`; each variant is driven by curl from a separate process against /downstream (global fetch), /downstream-http (node:http) and /sentinel.

A - baseline, import hook + JSON fix, traceLifecycle static (b-run.log):
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","spans":["router GET /downstream"]}
{"type":"transaction","name":"GET /downstream-http","op":"http.server","source":"route","status":"ok","spans":["router GET /downstream-http","http.client GET http://127.0.0.1:41972/api/downstream-http"]}
recorder (b-rec.log): {"url":"/api/downstream","sentryTrace":null,"baggage":null} vs {"url":"/api/downstream-http","sentryTrace":"a16d3344645c44a7bedc4376aabd8933-9838fc5dae0d9468-1","baggage":"...sentry-trace_id=a16d3344645c44a7bedc4376aabd8933,..."}

E - baseline, same wiring, traceLifecycle stream (c-run.log): identical gap.
{"type":"span","items":["router /downstream","http.server GET /downstream"]}
c-rec.log: {"url":"/api/downstream","sentryTrace":null,"baggage":null}

So no init placement, entry shape, lifecycle, or hook variant changes it: node:http is instrumented, global fetch is not. Every route span and the node:http client span are otherwise correct, so this is a single missing integration, not broken tracing.

The repo's only Hapi reference app is dev-packages/e2e-tests/test-applications/node-hapi, which runs on @sentry/node where fetch is undici and covered by nativeNodeFetchIntegration; there is no Deno equivalent to copy.

## Workaround

A 25-line userland integration restores both the span and the headers, in both lifecycles, with and without the import hook. ./fetch-integration.ts:

import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl, LRUMap, shouldPropagateTraceForUrl } from '@sentry/core';
const headersUrlMap = new LRUMap<string, boolean>(100);
const spanMap: Record<string, any> = {};
export const denoFetchIntegration = defineIntegration(() => ({
  name: 'DenoUserlandFetch',
  setupOnce() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient();
      if (!client) return;
      if (isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true,
        url => shouldPropagateTraceForUrl(url, client.getOptions().tracePropagationTargets, headersUrlMap),
        spanMap, { spanOrigin: 'auto.http.fetch' });
    });
  },
}));

then Sentry.init({ ..., integrations: [denoFetchIntegration()] }).

B - fetchfix, static: {"type":"transaction","name":"GET /downstream","source":"route","spans":["router GET /downstream","http.client GET http://127.0.0.1:41972/api/downstream"]} and recorder {"url":"/api/downstream","sentryTrace":"c38ced0aae64439480dd3f79e4b69bf4-833ca5279dc94ae1-1","baggage":"...sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true..."}
C - fetchfix, stream: {"type":"span","items":["http.client GET 127.0.0.1","router /downstream","http.server GET /downstream"],"raw":[{"name":"GET 127.0.0.1","origin":"auto.http.fetch",...}]} plus the headers.
D - fetchfix without the import hook (main-nohook.ts): the http.client span and headers still appear; only the Hapi router span and route-based transaction name are lost (source drops to "url").

No SDK source change is needed, and the same shim is runtime-generic: it only uses exports already public from @sentry/core.

## Docs impact

On Deno, the Sentry SDK does not instrument the global `fetch`: calls made with `fetch()` produce no `http.client` span and carry no `sentry-trace` or `baggage` header, so the downstream service starts a new trace. Only `node:http`/`node:https` client requests are traced and propagated, so either route outgoing calls through `node:http` or register a fetch integration built on `addFetchInstrumentationHandler` + `instrumentFetchRequest` from `@sentry/core`. This is independent of the web framework (Hapi, Koa, Oak, Hono all behave the same) and of `traceLifecycle`.
