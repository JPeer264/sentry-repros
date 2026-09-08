# verify4-M-fresh-bun-routenames

## What it re-tests

Independent re-test of the capability **route names (Fresh 2 on bun 1.4.0, @sentry/bun develop/10.67.0)** of cell `M-fresh-bun` (see `$REPRO/cells/M-fresh-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-staticA.log`, `app-staticB.log`, `app-staticD.log`, `app-streamB.log`, `app-streamB2.log`, `app-v2-boom.log`, `app-v2-static-A.log`, `app-v2-static-B.log`, `app-v2-static-C.log`, `app-v2-static-D.log`, `app-v2-static-bunroutes.log`, `app-v2-static-none.log`, `app-v2-stream-A.log`, `app-v2-stream-B.log`, `app-v2-stream-D.log`, `app-v2-stream-NONE.log`, `app.log`, `app2.log`, `app3.log`, `bunapp.log`, `bunapp2.log`, `bunapp3.log`, `denoapp.log`, `entry-routes.ts`, `entry.ts`, `instrument.ts`, `items-staticA.json`, `items-staticB.json`, `items-staticD.json`, `items-streamB.json`, `items-streamB2.json`, `items-v2-boom.json`, `items-v2-static-A.json`, `items-v2-static-B.json`, `items-v2-static-C.json`, `items-v2-static-D.json`, `items-v2-static-bunroutes.json`, `items-v2-static-none.json`, `items-v2-stream-A.json`, `items-v2-stream-B.json`, `items-v2-stream-D.json`, `items-v2-stream-NONE.json`, `package-lock.json`, `package.json`, `pids.txt`, `rec.log`, `recorder.mjs`, `run.sh`, `run2.sh`, `sink-run.log`, `sink-run2.log`, `sink.log`, `sink.mjs`, `sinkpid`, `sinkpid2`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The "source is stuck on 'custom' in traceLifecycle 'static'" half of the partial verdict is an artifact of the original probe using the v10 attribute key. On develop (v11) the transaction source is read from `sentry.segment.name.source` (exported as `Sentry.SENTRY_SEGMENT_NAME_SOURCE` from `@sentry/bun`), not from `sentry.source`. `packages/core/src/tracing/sentrySpan.ts:451` does `const source = this._attributes[SENTRY_SEGMENT_NAME_SOURCE]` and `packages/core/src/utils/spanUtils.ts:492-498` shows `updateSpanName()` deliberately stamps that attribute with 'custom'. Setting the correct key AFTER (or instead of) `updateSpanName` wins in both lifecycles.

The prior probe's middleware (variant A) set `rootSpan.setAttribute("sentry.source", "route")`, which on v11 is an unread attribute, so 'custom' stayed.

I re-ran the prior agent's own Fresh-on-bun app with four middleware variants x both lifecycles, plus a Bun.serve `routes` variant, against a local sink.

--- baseline, middleware present but no naming (VARIANT=NONE) ---
static: {"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_attrs":{"source_attr":"url"}}
stream: {"type":"span","raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.bun.serve","source":"url"}]}
(confirms the out-of-the-box half of the claim; in stream the name is the bare method, not the URL)

--- A: Sentry.updateSpanName(root, name) + setAttribute("sentry.source","route")  [the prior probe] ---
static: {"name":"GET /users/:id","source":"custom","trace_attrs":{"source_attr":"custom","legacy_source_attr":"route"}}
stream: {"name":"GET /users/:id","is_segment":true,"source":"custom","custom_span_name":"GET /users/:id"}
Note: the prior report said stream reports source 'route' for this variant. It does not, it reports 'custom' there too. So variant A is worse than reported, and the working fix is the same in both lifecycles.

--- B: root.updateName(name) + setAttribute("http.route", route) + setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route")  [the fix, mirrors the SDK's own express patch-layer.ts:344-346] ---
static: {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_attrs":{"source_attr":"route","http_route":"/users/:id"}}
stream: {"type":"span","raw":[{"name":"GET /users/:id","status":"ok","is_segment":true,"origin":"auto.http.bun.serve","source":"route","http_route":"/users/:id"}]}
error route, static: {"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_attrs":{"source_attr":"route","http_route":"/boom"}} followed by {"type":"event","exception":"Error: fresh-bun-route-boom","mechanism":"fresh.middleware","handled":false,"trace_id":"50561738703e4162a8f20be818c05e26"} on the same trace.

--- C: same as B plus "url.template" ---  identical to B (source 'route').
--- D: Sentry.updateSpanName(root, name) THEN setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route") ---
static: {"name":"GET /users/:id","source":"route","trace_attrs":{"source_attr":"route"}}
stream: {"name":"GET /users/:id","is_segment":true,"source":"route","custom_span_name":"GET /users/:id"}
So the order does not matter, only the key does. D additionally keeps `sentry.custom_span_name` so nothing downstream can rename it; B is the closer match to what the SDK's own framework integrations write.

--- E: no Sentry code in the app at all, Fresh route patterns registered on Bun.serve instead ---
Bun.serve({ port, routes: { "/users/:id": (req) => server.fetch(req) }, fetch: (req) => server.fetch(req) })
static: {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","trace_attrs":{"source_attr":"route"}}
This is fully automatic (bunserver.ts:206-218 parameterizes only when `request.params` is non-empty), but you must hand-enumerate every parameterized Fresh route, and a param-less route registered there still reports 'url'. Variant B is the practical answer.

Repro (probe dir $SCRATCH/deep/verify4-M-fresh-bun-routenames/):
  files: app/main.ts (middleware, VARIANT env switch A/B/C/D), entry.ts, entry-routes.ts (variant E), instrument.ts, sink.mjs (extended to surface sentry.segment.name.source / sentry.source / http.route / sentry.custom_span_name), run.sh, run2.sh
  PORT=41871 node sink.mjs &
  zsh run.sh static B v2-static-B   # then read items-v2-static-B.json
  zsh run.sh stream B v2-stream-B
  zsh run2.sh static NONE v2-static-bunroutes entry-routes.ts
  npm install $S/pack/sentry-{bun,node,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz mysql2  (node_modules was already present; app/_fresh is the prebuilt SSR bundle, rebuild with `cd app && deno task build`)
Wiring is otherwise exactly the prior probe's: SDK external to the Fresh SSR bundle, node_modules one level above app/, `bun entry.ts`.

Not tested: whether the same middleware works under `deno serve` (out of scope, this is the bun probe). No Fresh e2e app exists in dev-packages/e2e-tests/test-applications and there is no Fresh guide under ~/dev/sentry-docs/docs/platforms/javascript/guides/, so there is no documented Fresh wiring to compare against.

## Workaround

Fresh 2 on bun, middleware in app/main.ts (registered before app.fsRoutes()):

import * as Sentry from "@sentry/bun";
const sentryMiddleware = define.middleware(async (ctx) => {
  const span = Sentry.getActiveSpan();
  const rootSpan = span && Sentry.getRootSpan(span);
  if (rootSpan && ctx.route) {
    rootSpan.updateName(`${ctx.req.method} ${ctx.route}`);
    rootSpan.setAttribute("http.route", ctx.route);
    rootSpan.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route"); // "sentry.segment.name.source"
  }
  try { return await ctx.next(); }
  catch (err) { Sentry.captureException(err, { mechanism: { type: "fresh.middleware", handled: false } }); throw err; }
});
app.use(sentryMiddleware);

Yields name 'GET /users/:id' with source 'route' in both traceLifecycle 'stream' and 'static'. Do NOT use `setAttribute('sentry.source', 'route')`, that key is v10 and is ignored on v11.

## Docs impact

To give a manually named root span the `route` source instead of `custom`, set the span name with `rootSpan.updateName(name)` and then `rootSpan.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route')` (the attribute is `sentry.segment.name.source`, exported as `SENTRY_SEGMENT_NAME_SOURCE`); `Sentry.updateSpanName()` on its own always marks the segment name source as `custom`, and the pre-v11 `sentry.source` attribute is no longer read. This belongs in docs/platforms/javascript/common/enriching-events/transaction-name/index.mdx ("While the Root Span Is Active"), which today shows only `updateSpanName` and never mentions how to keep a parameterized route name classified as a route.
