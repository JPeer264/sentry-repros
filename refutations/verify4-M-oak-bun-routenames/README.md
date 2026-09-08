# verify4-M-oak-bun-routenames

## What it re-tests

Independent re-test of the capability **route names (Oak 17.2.0 on Bun 1.4.0, @sentry/bun develop 10.67.0)** of cell `M-oak-bun` (see `$REPRO/cells/M-oak-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `.npmrc`, `app-derived-static.log`, `app-derived-stream.log`, `app-fetch-stream.log`, `app-routes-stream.log`, `app-wildcard-stream.log`, `app.ts`, `build.ts`, `drive.sh`, `instrument.ts`, `package-lock.json`, `package.json`, `r2-derived-stream.log`, `r2-fetch-stream.log`, `r2-routes-stream.log`, `r3-bundle-derived.log`, `r3-bundle-fetch.log`, `r3-derived-static.log`, `r3-fetch-static.log`, `r3-listen.log`, `r3-naming-fetch.log`, `r3-naming-listen.log`, `r3-tricky.log`, `r3-tricky2.log`, `run.sh`, `run.sh.bak`, `run.sh.bak2`, `run2.sh`, `run3.sh`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sink2.pid`, `sink3.log`, `sink3.pid`, `tricky.log`, `tricky.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Could NOT refute the "partial" report. Out of the box, with `Bun.serve({ fetch: req => app.fetch(req) })`, the server span carries no route. Reproduced in both lifecycles and in a bundle; the only thing that changes it is user code at the mount, not SDK config.

Root cause read from the SDK source, not guessed: `~/dev/sentry-worktrees/audit-runtime-docs/packages/bun/src/integrations/bunserver.ts:194-224` — `wrapRequestHandler(..., route?)` sets `SENTRY_SEGMENT_NAME_SOURCE='route'` + `url.template` only when a `route` string is passed, and the only caller that passes one is `instrumentBunServeRoutes` iterating `serveOptions.routes` (line 127-176). No `routes` map means `routeName = parsedUrl.pathname` and source `url`. Nothing in the SDK reads an Oak/Koa-style router.

Variants I ran (all against my own sink on 127.0.0.1:53197, app ports 54101-54119):

1) Baseline, `fetch: req => app.fetch(req)`, stream:
   SPAN name=GET op=http.server status=ok src=url tmpl=-
   SPAN name=GET op=http.server status=error src=url tmpl=-
   SPAN name=SELECT users op=db status=ok src=- tmpl=-
2) Baseline, static:
   TX name=GET /users/7 source=url status=ok tmpl=-
   TX name=GET /error source=url status=internal_error tmpl=-
   (Note a correction to the original report: static does NOT give a bare `GET`; it gives the raw pathname with source=url, i.e. a high-cardinality name.)
3) Bundled with `@sentry/bun/plugin` (`Bun.build({ target:'bun', external:['@sentry/*'], plugins:[sentryBunPlugin()] })`, then `bun dist/app.js`) — identical to baseline:
   === BUNDLED MODE=fetch
   SPAN name=GET op=http.server src=url  (x5; db span present, so the plugin did work, it just does not know Oak)
4) Init placement (import "./instrument" first line vs `--preload`) and `traceLifecycle` make no difference to the source attribute.
5) `app.listen({ port })` mount: server spans DO arrive (contradicting "effectively unsupported"), but method-only and with no request context:
   {"type":"span","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.bun.serve"}]}  (x5, /error one has status error)
   The naming middleware logs `[naming] /users/7 span=false route=/users/:id` for every request — `getActiveSpan()` is undefined inside Oak middleware under listen — and the thrown error produced no event and `/db` produced no db span. So under listen the spans exist but are unnameable and context-free.

BETTER WORKAROUND THAN THE ONE REPORTED (this is the one thing I would change in the finding). Instead of a per-request Sentry middleware, derive Bun's `routes` map from the Oak router at mount time. It contains zero Sentry API, runs once, and makes the SDK's own route naming fire:

  const handler = (req: Request) => app.fetch(req);
  const routes: Record<string, typeof handler> = {};
  for (const r of router) routes[r.path] = handler;
  Bun.serve({ port, hostname: "127.0.0.1", routes, fetch: handler });

  === MODE=derived LIFECYCLE=stream
  SPAN name=GET /users/:id op=http.server status=ok src=route tmpl=/users/:id
  SPAN name=GET /db op=http.server status=ok src=route tmpl=/db
  SPAN name=GET /error op=http.server status=error src=route tmpl=/error
  === MODE=derived LIFECYCLE=static
  TX name=GET /users/:id source=route status=ok tmpl=/users/:id
  TX name=GET /error source=route status=internal_error tmpl=/error
  {"exception":"Error: oak bun boom","mechanism":"auto.http.bun.serve","handled":false}
  Same result bundled. It also sets `url.template`, which the reported middleware does not.

Limits of that workaround, measured with Oak's exotic path shapes (tricky.ts): `Bun.serve` accepts them without throwing, and anything it does not match falls through to the `fetch` handler, so behavior is never changed, only the name. `/api/opt` (matching `/api/opt/:a?`) and `/api/star/a/b` (matching `/api/star/(.*)`) fell through and got `SPAN name=GET ... src=url`. And Bun ignores an inline regex constraint, so `/api/num/abc` — which Oak 404s — was still labeled `SPAN name=GET /api/num/:id(\d+) status=error src=route`. Plain and `:param` routes are exact.

Repo reference: the only Bun e2e app, `~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/bun-mysql/src/app.ts`, mounts a bare `fetch(req)` with manual `url.pathname` branching, so the repo itself has no example of route-named Bun spans and no Oak app at all.

Files (rerunnable): $SCRATCH/deep/verify4-M-oak-bun-routenames/ — app.ts (MODE=fetch|routes|derived|wildcard|listen, NAMING=on for the middleware variant), instrument.ts, tricky.ts, build.ts, sink.mjs, drive.sh, run2.sh/run3.sh, logs r2-*.log, r3-*.log. Commands: `PORT=53197 node sink.mjs &` then `./run3.sh derived stream 54105`. Sink and all app processes were killed.

## Workaround

Give Bun.serve a `routes` map derived from the Oak router at startup, and keep `fetch` as the fallback: `const handler = (req: Request) => app.fetch(req); const routes: Record<string, typeof handler> = {}; for (const r of router) routes[r.path] = handler; Bun.serve({ port, routes, fetch: handler });`. This yields `GET /users/:id` with `sentry.segment.name.source=route` and `url.template` in both stream and static lifecycles, on the error path too, bundled or not, with no Sentry-specific code. Routes using regex constraints, optional params or `(.*)` are named imprecisely or fall back to the method-only name; list those explicitly in the map if their names matter. The alternative is the reported router-level middleware (`Sentry.updateSpanName` + `SENTRY_SEGMENT_NAME_SOURCE`), which also works but runs per request and does not set `url.template`. Neither works under `app.listen()`.

## Docs impact

On Bun, Sentry names the server span from the `routes` map you pass to `Bun.serve`, so an Oak app mounted as `Bun.serve({ fetch: req => app.fetch(req) })` produces spans named `GET` (source `url`) no matter the lifecycle, init placement, or whether you bundle with `@sentry/bun/plugin`; to get route names, build the `routes` map from your router at startup — `const handler = (req: Request) => app.fetch(req); const routes = {}; for (const r of router) routes[r.path] = handler; Bun.serve({ port, routes, fetch: handler });` — which yields `GET /users/:id` with `sentry.segment.name.source=route` and `url.template` on success and error paths alike (routes with regex constraints, optional params or wildcards fall back to the method-only name), and note that `app.listen()` must not be used: its spans arrive method-named and Oak middleware sees no active span, so errors and database spans inside a request are lost.
