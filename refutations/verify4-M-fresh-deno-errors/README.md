# verify4-M-fresh-deno-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-fresh-deno` (see `$REPRO/cells/M-fresh-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build.log`, `dev-baseline.log`, `dev-console.log`, `dev-console2.log`, `dev.pid`, `prod-console.log`, `prod-onerror.log`, `prod.pid`, `run-b/`, `sdkdeps/`, `sink.log`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Setup reused (and extended) the earlier probe app at $SCRATCH/deep/verify4-M-fresh-deno-errors/app (Fresh 2.3.3 + @fresh/plugin-vite 1.1.2, deno 2.9.0, @sentry/deno 10.67.0 from develop in app/node_modules, traceLifecycle static, tunnel to my sink on 52117). Probe files: app/instrument.ts, app/main.ts, app/early.ts, app/routes/_error.tsx, app/routes/api/boom2.ts, app/routes/throwpage.tsx; driver run-b/drive.sh; logs run-b/*.log. Commands: `SENTRY_MODE=<mode> SINK_PORT=52117 deno task dev --port 52118` and `deno task build && SENTRY_MODE=<mode> SINK_PORT=52117 deno serve -A --port 52119 _fresh/server.js`, then `run-b/drive.sh <appport> 52117 <label>` (hits /api/boom = programmatic app.get route, /api/boom2 = fs route handler, /throwpage = page render throw, then a captureMessage sentinel).

CONFIRMED, no automatic capture. Baseline (no wiring), dev and prod, all three throw shapes:
  /api/boom -> 500 ; /api/boom2 -> 500 ; /throwpage -> 500
  tx | GET /api/boom | src= url | status= internal_error | trace= 809d5817
  tx | GET /api/boom2 | src= url | status= internal_error | trace= 96164bfa
  tx | GET /throwpage | src= url | status= internal_error | trace= 5bf72d3f
  event | sentinel | mech= generic handled= True
This is structural: jsr @fresh/core 2.3.3 src/app.ts App.handler() ends in `catch (err) { ctx.error = err; return await DEFAULT_ERROR_HANDLER(ctx); }`, so nothing escapes to Deno.serve/node:http. (Note the transaction status IS internal_error, so 500s are at least visible as failed transactions.)

REFUTED: the middleware is NOT the only mechanism. Four wirings all deliver the exception with the request's trace id, request data, and (in the built app) context lines, in BOTH `vite dev` and `deno serve _fresh/server.js`:

1) captureConsoleIntegration - init only, zero framework code, zero middleware. `integrations: [Sentry.captureConsoleIntegration({ levels: ['error'], handled: false })]`. It works because DEFAULT_ERROR_HANDLER does `console.error(error)` and core's console handler does `args.find(arg => arg instanceof Error)` -> captureException with the real stack.
  PROD: event | Error: fresh-deno-boom   | mech= auto.core.capture_console handled= False | ctxline= True | trace= 91440922
        event | Error: fresh-fsroute-boom | mech= auto.core.capture_console handled= False | ctxline= True | trace= f6f27fbc
        event | Error: fresh-render-boom  | mech= auto.core.capture_console handled= False | ctxline= True | trace= 11c92867
  DEV: same three, each on its transaction's trace (mech= auto.core.capture_console, tx= GET /api/boom etc.).
2) setErrorInterceptor from `jsr:@fresh/core@^2.3.3/internal` (public JSR export, `setErrorInterceptor(app, err => Sentry.captureException(err, ...))`, no ctx.next wrapping). Works in dev too even though @fresh/plugin-vite calls it per request - the compiled chain closes over the interceptor set at handler() time.
  PROD: event | Error: fresh-deno-boom | mech= fresh.errorInterceptor handled= False | ctxline= True | trace= 8800dad3 (+ the other two)
3) The reported try/catch middleware - reconfirmed, and it also covers fs routes and page renders, not just app.get routes (mech= fresh.middleware, all three, dev and prod).
4) routes/_error.tsx capturing `props.error` - works, but only for fs routes: /api/boom2 and /throwpage produced `mech= fresh._error`, /api/boom (registered via app.get, outside the fsRoutes segment) produced nothing.

NEW LIMITATION the report missed: any programmatic Fresh error handler silently kills mechanisms 1-3, including the reported middleware. With `app.onError("*", () => new Response("custom error page", { status: 500 }))` registered, prod runs produced ZERO events in every wiring:
  PROD captureConsole + error page  -> only tx rows + sentinel, no event (console.error is never reached)
  PROD setErrorInterceptor + error page -> only tx rows + sentinel, no event
  PROD middleware + error page      -> only tx rows + sentinel, no event (the error never reaches the outer catch)
Capturing inside the error handler itself is then the only option and does work: `app.onError("*", ctx => { Sentry.captureException(ctx.error, ...); return ... })` gave mech= fresh.onError for all three shapes in dev and prod. A file-based routes/_error.tsx behaves differently from app.onError: it renders the custom page AND the error still reaches an outer middleware, so combining the two double-captures (one of the two events is then dropped by the default dedupe integration - which one wins is not predictable).

ROOT CAUSE of "nothing about the framework is instrumented" (bonus, bears on the routenames/spans cells): Fresh 2 ships its own OTel instrumentation - src/otel.ts does `trace.getTracer("fresh", VERSION)` at module scope, compileMiddlewares wraps every chain in `tracer.startActiveSpan("middlewares", ...)`, `recordSpanError` calls `span.recordException(err)`, and App.handler does `span.updateName(`${method} ${pattern}`)` + `span.setAttribute("http.route", pattern)` on the active OTel span. @sentry/deno DOES register a global OTel provider (build/esm/opentelemetry/tracer.js: `setupOpenTelemetryTracer(){ trace.disable(); trace.setGlobalTracerProvider(new SentryDenoTraceProvider()); }`) and there is exactly ONE @opentelemetry/api copy (1.9.1) in the built bundle - yet no Fresh span ever arrives (`tx | GET /api/users/42 | spans= []`). My /api/otel probe pins the reason: a tracer obtained AFTER init works, one obtained BEFORE init is dead forever, because `trace.disable()` replaces the ProxyTracerProvider singleton and orphans every ProxyTracer handed out earlier:
  {"tracer":"SentryDenoTracer","earlyTracer":"ProxyTracer","earlySpan":"NonRecordingSpan","span":"SentrySpan","globalVersion":"1.9.1"}
(`span` = probe span started at request time -> real SentrySpan and it does show up: `tx | GET /api/otel | spans= ['probe-span']`; `earlySpan` = tracer captured in early.ts imported one line before instrument.ts -> NonRecordingSpan.) Fresh's module-level tracer is exactly this case, so all of Fresh's native spans and its http.route naming are silently discarded. Fixing Sentry.init to not orphan pre-existing tracers (or to set the delegate on the existing proxy provider) would light up Fresh middleware/render spans and route names for free. I could not find a user-side ordering fix: preloading with `deno serve -A --import=./instrument.ts _fresh/server.js` still left the pre-init tracer a NonRecordingSpan.

Not applicable/not tried: no Fresh e2e app exists in the repo (dev-packages/e2e-tests/test-applications has deno, deno-mysql, deno-pg, deno-redis, deno-streamed only, all raw Deno.serve), and ~/dev/sentry-docs/docs/platforms/javascript/guides/deno/ has no Fresh page at all. All processes I started were killed; ports 52117-52119 are free.

## Workaround

Two-part wiring, both verified in `vite dev` and in the `deno serve _fresh/server.js` build. (a) If the app has no custom error handler, the cheapest capture is init-only, no framework code: `Sentry.init({ ..., integrations: [Sentry.captureConsoleIntegration({ levels: ['error'], handled: false })] })` in instrument.ts, imported as the first line of main.ts - Fresh's DEFAULT_ERROR_HANDLER console.errors every swallowed route, fs-route and render error and the integration turns it into a real exception event on the request's trace. (b) The moment the app registers an error handler (`app.onError("*", ...)`), that integration - and a try/catch middleware, and setErrorInterceptor - all go silent, so capture inside the handler instead: `app.onError("*", (ctx) => { Sentry.captureException(ctx.error, { mechanism: { type: 'fresh.onError', handled: false } }); return new Response("Internal server error", { status: 500 }); })`. A file-based routes/_error.tsx capturing props.error works too but covers only fs routes, not routes registered with app.get/post/etc. `setErrorInterceptor(app, err => Sentry.captureException(err, ...))` from `jsr:@fresh/core@^2.3.3/internal` is the least intrusive alternative to the try/catch middleware when there is no error handler.

## Docs impact

A Deno/Fresh guide must say: Fresh catches every route, fs-route and render error inside `App.handler()` and answers with its own 500, so `Sentry.init()` alone reports nothing - add `captureConsoleIntegration({ levels: ['error'], handled: false })` for apps that use Fresh's default error page, and, if you register your own error handler (`app.onError` or `routes/_error.tsx`), call `Sentry.captureException(ctx.error, { mechanism: { type: 'fresh.onError', handled: false } })` inside that handler, because a custom error handler stops the console integration, a `ctx.next()` try/catch middleware and `setErrorInterceptor` from ever seeing the error; note also that Fresh's own OpenTelemetry spans and its `http.route` naming do not reach Sentry today, so transactions stay URL-named.
