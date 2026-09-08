# verify4-M-fresh-deno-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-fresh-deno` (see `$REPRO/cells/M-fresh-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build-verify.log`, `build-verify2.log`, `build.log`, `dev-baseline-static.log`, `dev-baseline-static2.log`, `dev-baseline-stream.log`, `dev-ctxmgr-static.log`, `dev-ctxmgr-stream.log`, `dev-ctxmgractive-static.log`, `dev-ctxmgractive-static2.log`, `dev-ctxmgractive-stream.log`, `dev-denootel-stream.log`, `dev-middleware-stream.log`, `drive.sh`, `drive2.sh`, `init.log`, `out-base-static.serverlog`, `out-base-static.txt`, `out-ctx-static.serverlog`, `out-ctx-static.txt`, `out-ctx-stream.serverlog`, `out-ctx-stream.txt`, `out-ctxroute-static.serverlog`, `out-ctxroute-static.txt`, `out-ctxroute-stream.serverlog`, `out-ctxroute-stream.txt`, `out-prod-base-static.serverlog`, `out-prod-base-static.txt`, `out-prod-ctx-static.serverlog`, `out-prod-ctx-static.txt`, `out-prod-ctxroute-stream.serverlog`, `out-prod-ctxroute-stream.txt`, `ports.env`, `prod-baseline-stream.log`, `prod-ctxmgr-stream.log`, `report.py`, `run.sh`, `run2.sh`, `runprod.sh`, `runprod2.sh`, `sdkdeps/`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.mjs`, `sink3.log`, `sink3.pid`, `sink4.log`, `sink4.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Refutation attempt failed: no configuration of @sentry/deno 10.67.0 (develop, 6f2da7483d) names a Fresh 2 route by itself. Both server shapes and both lifecycles still emit the raw URL, and app code is required in every case. I did find the exact root cause and a workaround that is smaller and better than the reported Fresh middleware.

Root cause (sharper than the original report). @sentry/deno DOES ship an OTel bridge: `init()` calls `setupOpenTelemetryTracer()` unless `enableOpenTelemetrySetup: false` (app/node_modules/@sentry/deno/build/esm/sdk.js:48-50 -> build/esm/opentelemetry/tracer.js). It calls `trace.disable()` and `trace.setGlobalTracerProvider(new SentryDenoTraceProvider())`, so `trace.getTracer(...).startSpan()/startActiveSpan()` DO produce real Sentry spans - I see Fresh's own `via-tracer`/`handler` spans arriving. What it does not install is an OTel ContextManager, so `context.active()` is still the NoopContextManager and `trace.getActiveSpan()` returns undefined. Fresh 2's router (jsr @fresh/core 2.3.3 src/app.ts:444-448: `const span = trace.getActiveSpan(); if (span && pattern) { span.updateName(`${method} ${pattern}`); span.setAttribute("http.route", pattern); }`) therefore no-ops. The SDK's own JSDoc for `enableOpenTelemetrySetup` admits the gap: "This does not handle custom context handling, it will always work off the current scope." The prior report's "@opentelemetry/api resolves to the NoopTracer" is half right: the tracer is Sentry's, the CONTEXT is noop.

Baseline (unchanged, my run) - vite dev, static:
  transaction | GET /api/users/42 | op=http.server | src=url | route=None | segsrc=url  spans= []
  transaction | GET /api/boom | op=http.server | src=url | route=None | segsrc=url  spans= []
Baseline - `deno serve _fresh/server.js` build, static: identical (`GET /api/users/42 | src=url | route=None`).

Working workaround, no Fresh middleware at all - register an OTel ContextManager in instrument.ts that resolves the SPAN key to the active Sentry root span (mode `ctxmgr-route`, app/instrument.ts). Fresh's built-in call then does all the naming:
  vite dev, static:  transaction | GET /api/users/:id | op=http.server | src=route | route=/api/users/:id | segsrc=route
  vite dev, stream:  span | http.server | GET /api/users/:id | src=route | route=/api/users/:id | seg=True
  deno serve build, stream: span | http.server | GET /api/users/:id | src=route | route=/api/users/:id | seg=True
  deno serve build, static: transaction | GET /api/users/:id | op=http.server | src=custom | route=/api/users/:id (mode `ctxmgr`, the plain variant)
The plain bridge (return the Sentry root span object as-is, mode `ctxmgr`) already gives `GET /api/users/:id` + `http.route` but leaves `src=custom`, because core's `updateName` marks the source custom. Wrapping the span so that `setAttribute("http.route", ...)` also sets `sentry.segment.name.source: "route"` upgrades it to `src=route`. Child spans (`custom work`, `via-tracer`) still nest correctly under the segment with the bridge installed.

Also re-checked and ruled out: `Deno.telemetry.contextManager` as the global context manager (mode `denootel`) - Deno's context never holds a Sentry span because the SDK called `trace.disable()`, so getActiveSpan stays undefined; there is no Fresh guide in ~/dev/sentry-docs/docs/platforms/javascript/guides/ (only `deno/index.mdx` + `deno/configuration`), and no Fresh e2e app in dev-packages/e2e-tests/test-applications (only deno, deno-mysql, deno-pg, deno-redis, deno-streamed), so there is no documented wiring to fall back on.

Files (all under $SCRATCH/deep/verify4-M-fresh-deno-routenames/): app/instrument.ts (modes baseline | ctxmgr | ctxmgr-active | ctxmgr-route | denootel | middleware), app/main.ts, app/routes/api/{boom,child,sentinel}.ts, app/routes/api/users/[id].ts, sink2.mjs, report.py, run2.sh, runprod2.sh, drive2.sh, and the captured results out-base-static.txt, out-ctx-static.txt, out-ctx-stream.txt, out-ctxroute-static.txt, out-ctxroute-stream.txt, out-prod-base-static.txt, out-prod-ctx-static.txt, out-prod-ctxroute-stream.txt.
Rerun: `PORT=51477 node sink2.mjs &` then `./run2.sh <mode> <static|stream> <label>` (vite dev, port 51478) or `cd app && deno task build` + `./runprod2.sh <mode> <lifecycle> <label>` (deno serve, port 51479); each writes out-<label>.txt.

## Workaround

In instrument.ts, after Sentry.init, install an OTel ContextManager that maps the OTel active-span key to the active Sentry root span - then Fresh 2 names its own routes, in dev and in the build, in both lifecycles, with no Fresh middleware:

const SPAN_KEY = Symbol.for("OpenTelemetry Context Key SPAN");
function bridgeSpan() {
  const active = Sentry.getActiveSpan();
  if (!active) return undefined;
  const root = Sentry.getRootSpan(active);
  return {
    updateName(n) { Sentry.updateSpanName(root, n); return this; },
    setAttribute(k, v) {
      root.setAttribute(k, v);
      if (k === "http.route") root.setAttribute("sentry.segment.name.source", "route");
      return this;
    },
    setAttributes(a) { for (const [k, v] of Object.entries(a)) this.setAttribute(k, v); return this; },
    spanContext: () => root.spanContext(),
    isRecording: () => true,
    setStatus() { return this; },
    recordException(e) { Sentry.captureException(e); return this; },
    addEvent() { return this; },
    end() {},
  };
}
class Ctx {
  constructor(m = new Map()) { this.m = m; }
  getValue(k) { return k === SPAN_KEY ? bridgeSpan() : this.m.get(k); }
  setValue(k, v) { const m = new Map(this.m); m.set(k, v); return new Ctx(m); }
  deleteValue(k) { const m = new Map(this.m); m.delete(k); return new Ctx(m); }
}
context.setGlobalContextManager({
  active: () => new Ctx(),
  with: (_c, fn, self, ...a) => fn.call(self, ...a),
  bind: (_c, t) => t,
  enable() { return this; },
  disable() { return this; },
});

(`context` from "@opentelemetry/api", which must be in deno.json imports.) Errors still need the try/catch middleware from the earlier report - this bridge only fixes naming. The alternative, if you already have a Fresh middleware, is the reported `Sentry.updateSpanName(root, `${ctx.req.method} ${ctx.route}`)` + `http.route` + `sentry.segment.name.source` middleware; it produces the same names.

## Docs impact

The Deno SDK's OpenTelemetry compatibility layer (`enableOpenTelemetrySetup`, on by default) installs a tracer provider only, not a context manager: spans started through `tracer.startSpan()`/`startActiveSpan()` become Sentry spans, but `trace.getActiveSpan()` from `@opentelemetry/api` always returns `undefined`, so framework code that renames the active span - Fresh 2 does exactly this to apply `GET /api/users/:id` and `http.route` - silently has no effect and your transactions keep the raw URL as their name (`source: url`); until the SDK bridges the OTel context, name the segment yourself from the framework's matched pattern (`Sentry.updateSpanName(Sentry.getRootSpan(span), ...)` plus `http.route` and `sentry.segment.name.source: "route"`), either in a framework middleware or in a small `context.setGlobalContextManager` bridge in your instrumentation file.
