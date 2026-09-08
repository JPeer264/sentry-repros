# verify4-M-fresh-cf-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-fresh-cf` (see `$REPRO/cells/M-fresh-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build2.log`, `items-A-off-stream.json`, `items-B-custom-stream.json`, `items-C-route-stream.json`, `items-D-route-static.json`, `raw-A-off-stream.json`, `raw-B-custom-stream.json`, `raw-C-route-stream.json`, `raw-D-route-static.json`, `raw-E-bridge-stream.json`, `raw-F-route-fin-stream.json`, `raw-G-bridge-route-stream.json`, `raw-H-route-fin-static.json`, `raw-I-otelsetup-stream.json`, `raw-J-baseline-stream.json`, `raw-K-baseline-static.json`, `raw-L-route-stream.json`, `raw-M-route-static.json`, `raw-N-bridge-stream.json`, `run.sh`, `run2.sh`, `sink-A-off-stream.log`, `sink-B-custom-stream.log`, `sink-C-route-stream.log`, `sink-D-route-static.log`, `sink-E-bridge-stream.log`, `sink-F-route-fin-stream.log`, `sink-G-bridge-route-stream.log`, `sink-H-route-fin-static.log`, `sink-I-otelsetup-stream.log`, `sink-J-baseline-stream.log`, `sink-K-baseline-static.log`, `sink-L-route-stream.log`, `sink-M-route-static.log`, `sink-N-bridge-stream.log`, `sink.mjs`, `wrangler-A-off-stream.log`, `wrangler-B-custom-stream.log`, `wrangler-C-route-stream.log`, `wrangler-D-route-static.log`, `wrangler-E-bridge-stream.log`, `wrangler-F-route-fin-stream.log`, `wrangler-G-bridge-route-stream.log`, `wrangler-H-route-fin-static.log`, `wrangler-I-otelsetup-stream.log`, `wrangler-J-baseline-stream.log`, `wrangler-K-baseline-static.log`, `wrangler-L-route-stream.log`, `wrangler-M-route-static.log`, `wrangler-N-bridge-stream.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Baseline reproduced, then refuted. Probe dir: $SCRATCH/deep/verify4-M-fresh-cf-routenames (app/, run2.sh, raw-*.json). Fresh 2.3.3 + @fresh/plugin-vite 1.1.2, wrangler dev (workerd), develop SDK tarballs, sink on 52731, app on 52732. Reruns: `bash run2.sh <off|custom|route> <stream|static> <bridge on|off> <otelsetup on|off> <tag>`.

BASELINE (ROUTEMODE=off, exactly the probe's wiring) — claim reproduced:
  J-baseline-stream: SEG "GET" src=url route=undefined origin=auto.http.cloudflare
                     SEG "GET /" src=route (only because "/" is already low-cardinality)
  K-baseline-static: TX "GET /users/42" src=url ; TX "GET /iso/abc" src=url
  I-otelsetup-stream (`enableOpenTelemetrySetup: true`, nothing else): SEG "GET" src=url — the option changes nothing here, it installs only a tracer provider, no context manager.
Small correction to the probe: under stream the segment span does carry `sentry.segment.name.source`, its value is "url", not "absent".

FIX A — 8-line Fresh middleware in main.ts (works in BOTH lifecycles, including the erroring route):
  app.use(async ctx => {
    try { return await ctx.next(); } finally {
      const root = Sentry.getActiveSpan() && Sentry.getRootSpan(Sentry.getActiveSpan());
      if (root && typeof ctx.route === "string") {
        root.updateName(`${ctx.req.method} ${ctx.route}`);
        root.setAttribute("http.route", ctx.route);
        root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route"); // after updateName
      }
    }
  });
  L-route-stream: SEG "GET /users/:id" src=route route=/users/:id ; SEG "GET /iso/:tag" src=route ; SEG "GET /boom" src=route status=error
  M-route-static: TX "GET /users/:id" src=route segsrc=route route=/users/:id ; TX "GET /boom" src=route
Two details that decide the outcome: (1) `Sentry.updateSpanName()` (what the docs recommend) hard-codes source "custom" — B-custom-stream: SEG "GET /users/:id" src=custom, matching the probe; `span.updateName()` also sets "custom", so `SENTRY_SEGMENT_NAME_SOURCE` (exported from @sentry/cloudflare) must be set AFTER the rename. (2) the rename must sit in a `finally`: Fresh's segment error-catcher is OUTSIDE user middleware, so a throwing route handler skips any code placed after `await ctx.next()` — that is why the probe's /boom stayed "GET".

FIX B — no framework code at all: Fresh 2 already instruments itself with @opentelemetry/api. Its router does, before dispatch:
  const span = _trace.getActiveSpan(); if (span && pattern) { span.updateName(`${method} ${pattern}`); span.setAttribute("http.route", pattern); }
  (app/_fresh/server/server-entry.js:6366-6370)
That hook is dead on Cloudflare because @sentry/cloudflare never registers an OTel context manager, so `context.active()` is always ROOT_CONTEXT (documented in packages/opentelemetry/src/tracer.ts:69-72). Registering a ~10-line bridging context manager in worker.ts whose `active()` returns `trace.setSpan(ROOT_CONTEXT, Sentry.getActiveSpan())` (both copies of @opentelemetry/api are 1.9.1, so the global registry is shared with Fresh's inlined copy) makes Fresh name every span itself:
  N-bridge-stream: SEG "GET /users/:id" src=custom route=/users/:id ; SEG "GET /boom" src=custom route=/boom
Name and http.route are right for every route including the erroring one, but source is "custom" because `span.updateName()` sets it; combining the bridge with Fix A's one attribute line gives name + source=route everywhere (G-bridge-route-stream: SEG "GET /users/:id" src=route route=/users/:id).

Still true: @sentry/cloudflare ships no Fresh hook, so nothing here is automatic. No Fresh e2e app exists in the repo (dev-packages/e2e-tests/test-applications has cloudflare-workers, sveltekit-3-cloudflare-workers, nuxt-4-cloudflare, react-router-8-cloudflare, tanstackstart-react-cloudflare, none for Fresh). SDK-side follow-up worth filing: making `enableOpenTelemetrySetup` (or the Cloudflare wrapper itself) also install a context manager would light up Fresh's built-in route naming — and every other framework that instruments through @opentelemetry/api — with zero user code.

## Workaround

Add one middleware to Fresh's main.ts, before `app.fsRoutes()`, that renames the root span in a `finally` (so throwing routes are covered too) and then sets the source attribute, because `updateName`/`updateSpanName` force source "custom":

import * as Sentry from "@sentry/cloudflare";
app.use(async (ctx) => {
  try {
    return await ctx.next();
  } finally {
    const active = Sentry.getActiveSpan();
    const root = active && Sentry.getRootSpan(active);
    if (root && typeof ctx.route === "string") {
      root.updateName(`${ctx.req.method} ${ctx.route}`);
      root.setAttribute("http.route", ctx.route);
      root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route");
    }
  }
});

Verified as "GET /users/:id" with source "route" under both `traceLifecycle: "stream"` (span envelope) and `"static"` (transaction envelope). Optional extra: register a small @opentelemetry/api context manager in worker.ts whose `active()` returns `trace.setSpan(ROOT_CONTEXT, Sentry.getActiveSpan())` — Fresh's own router instrumentation then sets the parameterized name and `http.route` on its own.

## Docs impact

On Cloudflare Workers the Sentry request span is named by HTTP method only (source "url"), so a Fresh guide must show a `main.ts` middleware that, in a `finally` around `ctx.next()`, calls `rootSpan.updateName(`${ctx.req.method} ${ctx.route}`)`, then `rootSpan.setAttribute("http.route", ctx.route)` and `rootSpan.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, "route")` — the source must be set after the rename because both `span.updateName()` and `Sentry.updateSpanName()` mark the name as "custom", and the `finally` is required because Fresh's error boundary sits outside user middleware, so a throwing route would otherwise keep the unparameterized name.
