# verify4-M-fresh-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-fresh-cf` (see `$REPRO/cells/M-fresh-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `build.log`, `build2.log`, `build3.log`, `build4.log`, `rec.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.pid`, `sink3.pid`, `wrangler-b.log`, `wrangler-b.pid`, `wrangler-console.log`, `wrangler-console.pid`, `wrangler-console2.log`, `wrangler-console2.pid`, `wrangler.log`, `wrangler.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Rebuilt the Fresh 2 + Cloudflare probe from scratch (copy of the original app, same versions: @fresh/core 2.3.3, @fresh/plugin-vite 1.1.2, wrangler 4.129.0, compatibility_date 2026-05-01, nodejs_compat, @sentry/cloudflare 10.67.0 from $S/pack) and attacked the claim from four sides. The swallowing part of the claim is CONFIRMED; the "you must add routes/_error.tsx" part is REFUTED - an init-only option works with no framework file at all.

Why it is swallowed (read from the built bundle, app/_fresh/server/server-entry.js):
- line 6099 `DEFAULT_ERROR_HANDLER`: `console.error(error); return new Response("Internal server error", {status:500})`.
- line 6390 `App.handler()`: `catch (err) { ctx.error = err; return await DEFAULT_ERROR_HANDLER(ctx); }` - the error never leaves Fresh, so `withSentry`'s fetch never rejects.
- line 5439 `compileMiddlewares(middlewares, onError)` does call an `onError(err)` hook for every middleware error, but `App`'s `#onError` is initialised to `NOOP` (line 6170) and there is no public setter in 2.3.3, so that hook is unusable.
- Side note found while reading: line 6366 Fresh already does `_trace.getActiveSpan()?.updateName(`${method} ${pattern}`)` + `http.route` via a bundled @opentelemetry/api. The Cloudflare SDK registers no OTel global, so it is a NoopTracer and the rename never happens (that is why route names stay `GET /users/42`, source url).

RESULTS (sink at 127.0.0.1:41337, tunnel, sentinel-gated reads; `x-mode` request header selects the variant so one build covers all of them).

1) Baseline, no capture anywhere - CONFIRMED broken. `curl -H "x-mode: baseline" /boom?n=b1`:
  {"type": "transaction", "name": "GET /boom", "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "4261c84380874df68fb697f0458927f4", "sdk": "sentry.javascript.cloudflare", "spans": []}
  (no `event` item; wrangler log shows the root span finishing with no "Captured error event")

2) routes/_error.tsx with `Sentry.captureException(ctx.error, {mechanism:{type:'fresh.error_route',handled:false}})` - works, and `handled:false` is settable (the original probe's `generic`/`handled:true` was just the default options object):
  {"type": "event", "exception": "Error: fresh-cf-route-error-e1", "mechanism": "fresh.error_route", "handled": false, "frames": 10, "topFrame": "...worker.js:GET", "trace_id": "fc7734dca8b241218412ec8fc27e3bc3", "request": {"url": "http://127.0.0.1:41338/boom?n=e1", "method": "GET"}}
  {"type": "transaction", "name": "GET /boom", "status": "internal_error", "trace_id": "fc7734dca8b241218412ec8fc27e3bc3"}

3) A plain root middleware in main.ts (`app.use(async ctx => { try { return await ctx.next() } catch (e) { Sentry.captureException(e, {mechanism:{type:'fresh.middleware',handled:false}}); throw e } })`) - works, same trace, and unlike `_error.tsx` it does not have to produce the response:
  {"type": "event", "exception": "Error: fresh-cf-route-error-m1", "mechanism": "fresh.middleware", "handled": false, "frames": 10, "trace_id": "5e00b85e0d434c3797542b53b11a3e83", "request": {"url": "http://127.0.0.1:41338/boom?n=m1", "method": "GET"}}

4) THE REFUTATION - init-only, no routes/_error.tsx, no middleware, no framework file touched. Adding `integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })]` to the `withSentry` options picks up Fresh's own `console.error(error)` as a real exception event with the real stack:
  {"type": "event", "exception": "Error: fresh-cf-route-error-c1", "mechanism": "auto.core.capture_console", "handled": true, "logger": "console", "frames": 10, "topFrame": ".../worker-console.js:GET", "trace_id": "8af9c22924904342859c92171c813e80", "request": {"url": "http://127.0.0.1:41340/boom?n=c1", "method": "GET"}}
  {"type": "transaction", "name": "GET /boom", "status": "internal_error", "trace_id": "8af9c22924904342859c92171c813e80"}
  Same on the default stream lifecycle (traceLifecycle omitted, port 41341):
  {"type": "event", "exception": "Error: fresh-cf-route-error-s2", "mechanism": "auto.core.capture_console", "handled": true, "logger": "console", "trace_id": "3aa21a85dd5644ca990338a91024aa5b"}
  {"type": "span", "trace_id": "3aa21a85dd5644ca990338a91024aa5b", "items": ["http.server GET"], "raw": [{"name": "GET", "status": "error", "is_segment": true, "origin": "auto.http.cloudflare"}]}
  Caveat, measured: it reports every other `console.error` too, as a message event -
  {"type": "event", "message": "plain console.error noise x1", "mechanism": "auto.core.capture_console", "handled": true, "logger": "console", "topFrame": ".../worker-console.js:consoleHandler"}

5) Coverage beyond handlers: an error thrown in a page component (`routes/boomrender.tsx`) is swallowed identically and is caught by all three workarounds - middleware `{"exception": "Error: fresh-cf-render-error-r7", "mechanism": "fresh.middleware", "handled": false, "topFrame": ".../worker.js:Object.BoomRender"}`, _error.tsx `{"exception": "Error: fresh-cf-render-error-r8", "mechanism": "fresh.error_route", "handled": false}`, console integration `{"exception": "Error: fresh-cf-render-error-r4", "mechanism": "auto.core.capture_console", "topFrame": ".../worker-console.js:Object.BoomRender"}`. Baseline sends nothing for it.

6) Fresh trap worth knowing: `app.onError("/boom2", handler)` never fires for the fs route `/boom2`. `newErrorCmd` uses `includeLastSegment: true` while fs route commands resolve to the parent segment, so the error route lands on a segment no route belongs to; `/boom2` fell through to the root `_error.tsx`. Use `app.onError("*", ...)` (registered after `app.fsRoutes()`, since the later command overwrites the segment's errorRoute) or `routes/_error.tsx`.

7) Test artifact to be aware of when re-running: `dedupeIntegration` drops the second capture of an identical error message+stack, so firing /boom twice with the same message shows a false "no event". I made the route throw `fresh-cf-route-error-${n}` per request to avoid it.

No Fresh guide exists in ~/dev/sentry-docs (docs/platforms/javascript/guides/cloudflare/frameworks/ has astro, hono, hydrogen-*, nextjs, nuxt, remix, sveltekit, tanstack-start only), and there is no Fresh e2e app in the worktree; the nearest reference, dev-packages/e2e-tests/test-applications/cloudflare-workers, relies on the handler rejecting, which Fresh never does.

Rerun: files at $SCRATCH/deep/verify4-M-fresh-cf-errors/ - app/{worker.ts (plain init), worker-console.ts (captureConsoleIntegration + stream lifecycle), wrangler.jsonc, wrangler-console.jsonc, main.ts (middleware variant + app.onError), routes/{boom,boom2,boomrender,noise,sentinel,_error}.tsx}, sink.mjs (extended with frames/topFrame/level/logger), logs wrangler*.log, sink.log, build*.log. Commands: `cd app && deno task build`; `PORT=41337 node ../sink.mjs &`; `npx wrangler dev --port 41338 --inspector-port 0` and `npx wrangler dev --config wrangler-console.jsonc --port 41341 --inspector-port 0`; then `curl -H "x-mode: baseline|errorroute|middleware" "http://127.0.0.1:<port>/boom?n=<unique>"` followed by `curl "http://127.0.0.1:<port>/sentinel?n=<k>"` and `curl http://127.0.0.1:41337/__items`. All processes killed.

## Workaround

Two that work, both verified on Fresh 2.3.3 / wrangler 4.129.0 / @sentry/cloudflare 10.67.0. (a) Init-only, no framework file: add `integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })]` to the options `withSentry` returns; Fresh's DEFAULT_ERROR_HANDLER `console.error(error)`s the real Error, so the event carries the correct type, message and stack and shares the request's trace - the cost is that every other `console.error` in the app also becomes an issue, and the mechanism reads `auto.core.capture_console` / `handled: true`. (b) Explicit capture, better mechanism: either `routes/_error.tsx` with `Sentry.captureException(ctx.error, { mechanism: { type: "fresh", handled: false } })`, or a root middleware in main.ts before `app.fsRoutes()`: `app.use(async ctx => { try { return await ctx.next(); } catch (e) { Sentry.captureException(e, { mechanism: { type: "fresh", handled: false } }); throw e; } })` - the middleware form is preferable because it does not also have to render the 500 page and it still lets `routes/_error.tsx` produce the response. Both (a) and (b) also cover errors thrown while rendering a page component.

## Docs impact

On Fresh 2 nothing that a route handler, middleware or page component throws ever reaches Sentry on its own: Fresh's default error handler catches it, `console.error`s it and returns a 500, so `withSentry` only marks the request span `internal_error` - either add `Sentry.captureConsoleIntegration({ levels: ["error"] })` to your `Sentry.init` options, which turns Fresh's own `console.error(error)` into a Sentry issue without touching any framework file (at the price of reporting every other `console.error` too), or capture explicitly in a root middleware (`app.use(async ctx => { try { return await ctx.next(); } catch (e) { Sentry.captureException(e); throw e; } })`) or in `routes/_error.tsx` via `Sentry.captureException(ctx.error)`.
