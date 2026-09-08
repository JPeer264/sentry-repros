# verify4-M-oak-deno-routenames

## What it re-tests

Independent re-test of the capability **route names (Oak 17.2.0 on Deno 2.9.0, @sentry/deno develop 10.67.0)** of cell `M-oak-deno` (see `$REPRO/cells/M-oak-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-after-static.log`, `app-after-stream.log`, `app-base-off-stream.log`, `app-finally-static.log`, `app-finally-stream.log`, `app-listen-finally-static.log`, `app-listen.log`, `app-nameonly.log`, `app-off-static.log`, `app-prefix-static.log`, `app-prefix-stream.log`, `app-prefix.log`, `app-routeruse-static.log`, `app-routeruse-stream.log`, `app-static-finally.log`, `app-static-routeruse.log`, `app-stream-finally.log`, `app-stream-routeruse.log`, `app-stream-routeruse2.log`, `app.pid`, `deno.json`, `deno.lock`, `drive.sh`, `instrument.ts`, `items-after-static.json`, `items-after-stream.json`, `items-base-off-stream.json`, `items-finally-static.json`, `items-finally-stream.json`, `items-listen-finally-static.json`, `items-off-static.json`, `items-prefix-static.json`, `items-prefix-stream.json`, `items-routeruse-static.json`, `items-routeruse-stream.json`, `main.ts`, `main2.ts`, `package.json`, `raw-prefix-static.json`, `raw-prefix-stream.json`, `run.sh`, `run2.sh`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Two of the three sub-claims hold; the interesting one (error path) is REFUTED.

CONFIRMED — nothing names the span out of the box. NAMING=off, Deno.serve(app.fetch):
  stream: [{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.deno"}]  (x4, no sentry.segment.name.source)
  static: tx: GET /users/7 | source: url   /   tx: GET /error/42 | source: url
There is no Oak integration in @sentry/deno (packages/deno/src/integrations/ has koa.ts but nothing Oak), and `setHttpServerSpanRouteAttribute` — the helper the SDK uses internally for exactly this (packages/server-utils/src/utils/setHttpServerSpanRouteAttribute.ts, exported from @sentry/server-utils/exports.ts) — is NOT re-exported from @sentry/deno (packages/deno/src/index.ts:118-144 re-exports only the orchestrion integrations). So the manual `updateSpanName` + `SENTRY_SEGMENT_NAME_SOURCE` recipe is the only route, and it omits `http.route` unless the user sets it too.

REFUTED — "the middleware runs after await next(), so it never applies on the error path". It is not a limitation of the approach, only of where the prior probe put the naming code. Two one-line variants cover the error path in BOTH lifecycles:
(a) `try { await next(); } finally { ...name... }` on the app-level middleware
(b) `router.use((ctx, next) => { ...name...; return next(); })` (router-level middleware runs after matching, before the handler; ctx.matched is already ["(.*)","/users/:id"])

stream (span envelope attributes, verbatim from the sink raw dump, NAMING=finally):
  GET /users/:id  {"sentry.origin":"auto.http.deno","sentry.op":"http.server","sentry.segment.name.source":"route",...}
  GET /error/:id  {"sentry.origin":"auto.http.deno","sentry.op":"http.server","sentry.segment.name.source":"route",...}
static (NAMING=finally): tx: GET /users/:id | source: route | tx: GET /ok | source: route | tx: GET /error/:id | source: route | tx: GET /sentinel | source: route
static (NAMING=after, the prior probe's shape, for contrast): tx: GET /error/42 | source: url  <- the only cell that differs
NAMING=routeruse gives the identical four route-named results in both lifecycles.

Also verified with the finally variant (main2.ts, no error middleware at all):
- prefixed routers give the full path: `new Router({prefix:"/api"})` -> `GET /api/users/:id` src=route http.route=/api/users/:id, and `GET /api/error/:id` src=route on the throwing route.
- unmatched request stays low cardinality: `[mw] /nope span=true matched=[]` -> span `GET` src=url, status 404 (dropped entirely in static by the default ignoreStatusCodes).
- with Deno.serve(app.fetch) the Sentry error middleware is unnecessary and produces no duplicate: the only event was `ev: Error: oak prefixed boom | mech: auto.http.deno | handled: false`.

CONFIRMED — app.listen() is a no-op for naming, and try/finally does not rescue it (MOUNT=listen, LIFECYCLE=static):
  [app.finally] /users/7 span=false matched=["/users/:id"]
  [app.finally] /error/42 span=false matched=["/error/:id"]
  transaction GET /users/7 url 3924c1556d7546709d4a2ba98d00a5e6
  transaction GET /error/42 url 5f8d4add47e7466c8b7976428e6222c1
  event Error: oak route boom  28df7e8e4261433785cbe13c799a70c9
  event undefined: sentinel    28df7e8e4261433785cbe13c799a70c9   <- same stale trace id, the isolation leak
Not fixable from user code: the naming needs the active span, which only exists inside the Deno.serve handler async context that Oak's own listen server drains away from.

Probe files (all absolute, rerunnable):
$SCRATCH/deep/verify4-M-oak-deno-routenames/
  deno.json, package.json (path-to-regexp@6.3.0), node_modules/@sentry/* symlinked to ~/dev/sentry-worktrees/audit-runtime-docs/packages/*
  instrument.ts   - @sentry/deno/import hook + init, LIFECYCLE env picks stream/static
  main.ts         - NAMING=off|after|finally|routeruse, MOUNT=serve|listen
  main2.ts        - the recommended recipe: prefixed router, try/finally naming + http.route, no error middleware
  run.sh / run2.sh, sink.mjs, app-*.log, items-*.json, raw-prefix-*.json
Commands:
  cd <dir> && npm install --no-save --ignore-scripts path-to-regexp@6.3.0
  PORT=41333 node sink.mjs > sink.log 2>&1 &
  ./run.sh finally-stream finally stream serve ; ./run.sh after-static after static serve ; ./run.sh listen-finally-static finally static listen ; ./run2.sh prefix-stream stream
(each script runs `deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts`, drives /users/7 /ok /error/42 /sentinel, waits for the sentinel, dumps the sink)
Repo reference: dev-packages/e2e-tests/test-applications/deno-streamed has no router at all, so it offers no Oak precedent.

## Workaround

Mount with `Deno.serve(app.fetch)` and add one app-level middleware that names the span in a `finally` block, so it also runs when the handler throws:

app.use(async (ctx, next) => {
  try {
    await next();
  } finally {
    const span = Sentry.getActiveSpan();
    const route = ctx.matched?.at(-1)?.path;
    if (span && route) {
      Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
      span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
      span.setAttribute('http.route', route);
    }
  }
});

Register it before `app.use(router.routes())`. It works in both `traceLifecycle: 'stream'` and `'static'`, on success and error paths, and with prefixed routers (`/api/users/:id`). A router-level `router.use((ctx, next) => { ...; return next(); })` is equivalent. Under `app.listen()` there is no workaround, `getActiveSpan()` is undefined there.

## Docs impact

On the Deno/Oak page: mount the app with `Deno.serve(app.fetch)` (never `app.listen()`, where Sentry has no active span, no request isolation and no error capture), and note that Sentry does not name spans after Oak routes automatically — add one middleware, registered before `router.routes()`, that reads `ctx.matched?.at(-1)?.path` inside a `try { await next(); } finally { ... }` and calls `Sentry.updateSpanName(span, ...)` plus `span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route')` and `span.setAttribute('http.route', route)`; the `finally` matters, because a middleware that names the span after `await next()` silently skips every request whose handler throws.
