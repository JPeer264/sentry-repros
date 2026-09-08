# verify4-M-koa-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch** of cell `M-koa-deno` (see `$REPRO/cells/M-koa-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app.ts`, `deno.json`, `fetch-integration.ts`, `fetchfix-stream.log`, `fetchfix.log`, `hook.log`, `instrument-fetchfix.ts`, `instrument.ts`, `main-fetchfix.ts`, `main-hook.ts`, `main-nohook.ts`, `nohook-stream.log`, `nohook-stream2.log`, `nohook.log`, `package-lock.json`, `package.json`, `pids.txt`, `recorder.log`, `recorder.mjs`, `run-b-base.log`, `run-b-base2.log`, `run-b-fix.log`, `run-b-fixstream.log`, `run-b-fixstream2.log`, `run-b-hook.log`, `run-b-recorder.log`, `run-b-recorder2.log`, `run-b-sink.log`, `run-b-sink3.log`, `run-b-stream.log`, `run-b-stream2.log`, `sink.log`, `sink2.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Reproduced the reported behavior exactly, and then made it work with a user-land integration, so the finding is real but its "no configuration exists" framing is too strong.

Root cause (source, not Koa): `@sentry/deno` ships NO fetch tracing integration. `packages/deno/src/sdk.ts` default integrations are eventFilters, requestData, functionToString, linkedErrors, dedupe, breadcrumbs, denoContext, denoServe, denoHttp, contextLines, normalizePaths, globalHandlers + server-utils error/tracing integrations. The only `fetch` code in `packages/deno/src` outside the transport is `integrations/breadcrumbs.ts` (breadcrumbs only). The built entry exports no fetch integration at all (grep of `build/esm/index.d.ts` for `*Integration` returns denoHttp/denoServe/denoKoa/... and nothing fetch-related). `denoHttpIntegration` subscribes only to `http.client.request.created` / `http.server.request.start` on `node:diagnostics_channel`, which Deno's native `fetch` never emits. Node's equivalent (`packages/node/src/integrations/node-fetch/`) is undici-based and does not apply to Deno. The repo's own e2e app confirms this is the intended state: `dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts` asserts only a span the app itself created with `Sentry.startSpan({name:'test-outgoing-fetch'})` and `origin: 'manual'` -- there is no assertion of an `http.client` span from fetch. Koa is irrelevant to the failure.

BASELINE (main-nohook.ts, traceLifecycle static, koa 3.2.1 + @koa/router 15.7.0, deno 2.9.0, @sentry/deno 10.67.0 from $REPRO/_toolbox/pack):
  {"type": "transaction", "name": "GET /downstream", "op": "http.server", "source": "url", "status": "ok", "trace_id": "9fdb81124a494836b44b610897f3402f", "sdk": "sentry.javascript.deno", "spans": [], "hasRequestData": false}
  {"type": "transaction", "name": "GET /downstream-http", "op": "http.server", "source": "url", "status": "ok", "trace_id": "7bbab1d627cd4e5a96b36ced2030dc8e", "sdk": "sentry.javascript.deno", "spans": ["http.client GET http://127.0.0.1:47312/api/node-http"], "hasRequestData": false}
recorder /__seen:
  {"url": "/api/fetch", "sentry-trace": null, "baggage": null, "traceparent": null}
  {"url": "/api/node-http", "sentry-trace": "7bbab1d627cd4e5a96b36ced2030dc8e-9c7626c1c137801b-1", "baggage": "sentry-environment=production,...,sentry-sampled=true,sentry-sample_rate=1"}

BASELINE, traceLifecycle stream (same gap, so the lifecycle is not the variable):
  {"type": "span", "trace_id": "bb6dd9be4c93446f9bb189a2d5df7810", "items": ["http.server GET"], "raw": [{"name": "GET", "status": "ok", "is_segment": true, "origin": "auto.http.server"}]}          <- /downstream, fetch span missing
  {"type": "span", "trace_id": "63be2ba831a14f5faf95a52c60a975e9", "items": ["http.client GET 127.0.0.1", "http.server GET"], "raw": [{"name": "GET 127.0.0.1", "status": "ok", "parent_span_id": "b2f6e4dbb7a7101e", "is_segment": false, "origin": "auto.http.client"}, ...]}   <- /downstream-http works

IMPORT HOOK: reconfirmed dead on arrival with a fresh install. `deno run ... main-hook.ts` (line 1 `import "@sentry/deno/import";`) -> `SyntaxError: Unexpected token ':'` at `node_modules/statuses/index.js:15` (`var codes = require('./codes.json')`), i.e. Deno K3 (denoland/deno#36240). Koa cannot be reached with the hook on, so the hook is not a route to fetch spans either.

WORKS WITH A USER-LAND INTEGRATION (this is the refutation): a ~20-line integration built from public `@sentry/core` exports (`addFetchInstrumentationHandler`, `instrumentFetchRequest`, `isSentryRequestUrl`) registered via `Sentry.init({ integrations: [manualFetchIntegration()] })` produces a correctly parented client span AND propagates headers, on both lifecycles, with the hook OFF (so Koa still boots).
static:
  {"type": "transaction", "name": "GET /downstream", "op": "http.server", "source": "url", "status": "ok", "trace_id": "d765a5ef83114bf9b7b1869b70b077c2", "sdk": "sentry.javascript.deno", "spans": ["http.client GET http://127.0.0.1:47312/api/fetch"], "hasRequestData": false}
  recorder: {"url": "/api/fetch", "sentry-trace": "d765a5ef83114bf9b7b1869b70b077c2-aef48b44f861ccfc-1", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=d765a5ef83114bf9b7b1869b70b077c2,sentry-sampled=true,sentry-sample_rand=0.19519996821777663,sentry-sample_rate=1"}
stream:
  {"type": "span", "trace_id": "eb2f8aa6a1564b3aaa17e0c4ce7b1448", "items": ["http.client GET 127.0.0.1", "http.server GET"], "raw": [{"name": "GET 127.0.0.1", "status": "ok", "parent_span_id": "bb63bc61ff041db5", "is_segment": false, "origin": "auto.http.fetch"}, {"name": "GET", "status": "ok", "is_segment": true, "origin": "auto.http.server"}]}

So: broken out of the box on every supported configuration (both lifecycles, hook on or off, Koa or not), but the runtime is capable and the fix is ~20 lines of app code. Fixing it properly is an SDK change: add a fetch integration to `packages/deno/src/integrations/` modelled on `packages/cloudflare/src/integrations/fetch.ts` and put it in `getDefaultIntegrations`; `packages/deno/src/integrations/breadcrumbs.ts` already patches global fetch for breadcrumbs, so the instrumentation hook is present and only the span/header half is missing.

Probe files (rerunnable; node_modules removed after the run, reinstall with the npm line below):
  $SCRATCH/deep/verify4-M-koa-deno-outgoingfetch/
    app.ts, deno.json, package.json, recorder.mjs
    instrument.ts (baseline), main-nohook.ts, main-hook.ts
    fetch-integration.ts + instrument-fetchfix.ts + main-fetchfix.ts (the working variant)
    run-b-base2.log, run-b-stream2.log, run-b-fix.log, run-b-fixstream2.log, run-b-hook.log
Commands:
  npm install --no-audit --no-fund koa@3.2.1 @koa/router@15.7.0 $REPRO/_toolbox/pack/sentry-deno-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
  PORT=39418 node $REPRO/_toolbox/sink.mjs &   PORT=47312 node recorder.mjs &
  TUNNEL=http://127.0.0.1:39418/ RECORDER=http://127.0.0.1:47312 PORT=51907 LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-nohook.ts
  (swap main-nohook.ts for main-fetchfix.ts / main-hook.ts; drive with curl /downstream, /downstream-http, /sentinel; read curl http://127.0.0.1:39418/__items and http://127.0.0.1:47312/__seen)
Caveat on ports: another agent's Next.js app was tunneling into ports 47311/47312 during part of the run, so some sink reads contain `sentry.javascript.nextjs` items; the deno items quoted above are the ones from this probe (all my final reads used a private sink on 39418).

Docs pages checked: ~/dev/sentry-docs/docs/platforms/javascript/guides/deno/ contains only index.mdx plus configuration/integrations/{breadcrumbs,contextlines}.mdx. The single fetch mention is breadcrumbs.mdx:23-27 ("Log HTTP requests done with the Fetch API"), which is accurate. There is no Koa page and no outgoing-request/distributed-tracing page for Deno, so nothing in the docs currently overclaims -- but nothing warns either.

## Workaround

Register a fetch integration by hand in the app; `@sentry/deno` has none. In instrument.ts, before `Sentry.init`:

// fetch-integration.ts
import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl } from "@sentry/core";
const spans: Record<string, any> = {};
export const manualFetchIntegration = defineIntegration(() => ({
  name: "ManualFetch",
  setupOnce() {
    addFetchInstrumentationHandler(handlerData => {
      const client = getClient();
      if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true, () => true, spans, { spanOrigin: "auto.http.fetch" });
    });
  },
}));

then `Sentry.init({ ..., integrations: [manualFetchIntegration()] })`. `@sentry/core` must be an explicit dependency and mapped in deno.json's import map. This gives a correctly parented `http.client` span (origin `auto.http.fetch`) plus `sentry-trace`/`baggage` on the outgoing request, on both `traceLifecycle: 'static'` and `'stream'`, and it works with the Deno import hook OFF, which is the only mode in which Koa boots at all. Two lower-effort fallbacks if you do not want a custom integration: wrap the call in `Sentry.startSpan(...)` (gives a `manual`-origin span, still no headers), or attach headers yourself from `Sentry.getTraceData()`. Both are strictly worse. For anything that runs over `node:http`/`node:https` instead of `fetch`, no workaround is needed: `denoHttpIntegration` already produces the span and the headers.

## Docs impact

On Deno the SDK does not create spans for outgoing `fetch()` calls and does not attach `sentry-trace`/`baggage` headers to them (only breadcrumbs are recorded); requests made through `node:http`/`node:https` are traced and propagated normally, so either use a `node:http`-based client or register a fetch integration in your own code with `addFetchInstrumentationHandler` and `instrumentFetchRequest` from `@sentry/core`. This is independent of Koa and of `traceLifecycle`, and it cannot be fixed by adding `import "@sentry/deno/import"`, which additionally makes any Koa app crash at startup on `require('./codes.json')` inside `statuses` (denoland/deno#36240) -- so a Koa-on-Deno setup must omit the import hook and must register its own `app.on('error', ...)` handler, since `@sentry/deno` exports no `setupKoaErrorHandler`.
