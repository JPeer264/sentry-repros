# verify4-M-express-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-express-cf` (see `$REPRO/cells/M-express-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `package-lock.json`, `package.json`, `run-b/`, `sink.log`, `sink.pid`, `src/`, `w-a1.log`, `wa1.pid`, `wrangler.a0.jsonc`, `wrangler.a1-nohandler.jsonc`, `wrangler.a1.jsonc`, `wrangler.a2-setuphandler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The "Shape A needs a hand-written middleware calling captureException, which yields mechanism=generic handled=true" half of the claim is wrong. It is wrong because the probe skipped the documented Express wiring: `Sentry.setupExpressErrorHandler(app)`. With that one line, plain `wrangler dev` (esbuild, NO Vite, NO build-time instrumentation, top-level `app.get(...)` + `app.listen(8080)`) captures every error shape automatically, as unhandled, correctly trace-linked.

EXACT CHANGE (Shape A entry, src/c1.js):
    import { httpServerHandler } from 'cloudflare:node';
    import * as Sentry from '@sentry/cloudflare';
    import { setupExpressErrorHandler } from '@sentry/server-utils';   // <-- NOT re-exported by @sentry/cloudflare
    import { buildApp } from './routes.js';

    const app = buildApp();
    setupExpressErrorHandler(app);   // after routes, before listen
    app.listen(8080);

    export default Sentry.withSentry(
      () => ({ dsn, tunnel: 'http://127.0.0.1:44821/', tracesSampleRate: 1.0, traceLifecycle: 'static', sendDefaultPii: true }),
      httpServerHandler({ port: 8080 }),
    );

CONTROL (c0, identical minus that line, port 44822) - reproduces the reported baseline exactly, no event at all:
    /boom -> 500  /boom-async -> 500  /boom-next -> 500
    {"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"3fb8751a537e48709318c801b224d6bc"}
    {"type":"transaction","name":"GET /boom-async","op":"http.server","source":"url","status":"internal_error",...}
    {"type":"transaction","name":"GET /boom-next","op":"http.server","source":"url","status":"internal_error",...}
    {"type":"event","message":"sentinel","mechanism":"generic","handled":true,...}   <-- sentinel proves nothing was in flight
(zero `event` items for the three throws)

WITH setupExpressErrorHandler (c1, traceLifecycle 'static', port 44823) - all three captured, auto + unhandled:
    {"type":"event","exception":"Error: express-cf-boom","mechanism":"auto.middleware.express","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"33cb6963e06b40a78c8a448f313ece65","user":{"ip_address":"127.0.0.1"},"request":{"url":"http://127.0.0.1:44823/boom","method":"GET"}}
    {"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"33cb6963e06b40a78c8a448f313ece65"}
    {"type":"event","exception":"Error: express-cf-boom-async","mechanism":"auto.middleware.express","handled":false,"trace_id":"d307adf44bc54ab8bbb8388db35a4996"}
    {"type":"event","exception":"Error: express-cf-boom-next","mechanism":"auto.middleware.express","handled":false,"trace_id":"b1b8a21579e646eea7cbb60a6bfe5f7a"}
    {"type":"event","message":"sentinel","mechanism":"generic","handled":true,...}
Sync throw, async throw and `next(err)` are all covered; express still answers 500.

OTHER TRACE LIFECYCLE (c2, default 'stream', port 44824) - identical error capture, so this is not lifecycle-dependent:
    {"type":"event","exception":"Error: express-cf-boom","mechanism":"auto.middleware.express","handled":false,"trace_id":"3f0f71fe788b4e59814d7b033c40e963"}
    {"type":"span","trace_id":"3f0f71fe788b4e59814d7b033c40e963","items":["http.server GET"],"raw":[{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.cloudflare"}]}
    {"type":"event","exception":"Error: express-cf-boom-async","mechanism":"auto.middleware.express","handled":false,...}
    {"type":"event","exception":"Error: express-cf-boom-next","mechanism":"auto.middleware.express","handled":false,...}

IMPORT PATH IS THE REAL TRAP (and the likely reason the original probe never tried it): `@sentry/cloudflare` 10.67.0 does not export `setupExpressErrorHandler`. `grep -c setupExpressErrorHandler node_modules/@sentry/cloudflare/build/types/index.d.ts` -> 0, and no hit in build/esm/prod/index.js either. `Sentry.setupExpressErrorHandler(app)` (the exact snippet every Express doc page prints) is `undefined` here and throws. It has to come from `@sentry/server-utils`, which must be listed explicitly in package.json.

OTHER VARIANTS TRIED (same dir, earlier pass of this task, logs kept):
- `integrations: [expressIntegration()]` from @sentry/server-utils on Shape A (src/a6.js, wrangler.a6.jsonc): nothing captured - the OTel-style integration has no channels to hook without build-time instrumentation. Only the error-handler middleware works on this shape.
- esbuild + orchestrion-style build-time instrumentation with a lazy app (build2.mjs -> dist-esb2): gives the Shape B behaviour (`auto.http.express`, handled:false, route names, handler spans) but also emits a spurious `TypeError: isPromise3 is not a function` per request - a separate defect, not this capability.
- Vite Shape B with top-level routes (vite.config2.mjs on src/a0.js) and esbuild build-time instrumentation with top-level routes: worker fails to boot, "Disallowed operation called within global scope". Confirms the reported lazy-app requirement, but only for build-time-instrumented shapes; Shape A takes top-level `app.get`/`app.listen` fine.
- Repo reference app: none exists. `grep -rl "httpServerHandler|cloudflare:node"` over dev-packages/e2e-tests/test-applications in ~/dev/sentry-worktrees/audit-runtime-docs returns nothing, and packages/cloudflare/src has no express reference. There is no e2e coverage for Express-behind-httpServerHandler on Workers at all.

So the only real gap left on Shape A is that the mechanism reads `auto.middleware.express` instead of Shape B's `auto.http.express`, and that Shape A still lacks route names / handler spans / db spans. Error capture itself is automatic and unhandled on both shapes.

FILES / COMMANDS (all under $SCRATCH/deep/verify4-M-express-cf-errors/run-b/):
  src/routes.js  - shared routes (/plain, /users/:id, /boom, /boom-async, /boom-next, /sentinel)
  src/c0.js + wrangler.c0.jsonc  - control, no error handler        (log w-c0.log)
  src/c1.js + wrangler.c1.jsonc  - setupExpressErrorHandler, static (log w-c1.log)
  src/c2.js + wrangler.c2.jsonc  - setupExpressErrorHandler, stream (log w-c2.log)
  src/a6.js, build2.mjs, build3.mjs, vite.config*.mjs - the refuted variants
  PORT=44821 node $S/qs/sink.mjs > sink-c.log 2>&1 &
  npx wrangler dev --config wrangler.c0.jsonc --port 44822 --inspector-port 0
  npx wrangler dev --config wrangler.c1.jsonc --port 44823 --inspector-port 0
  npx wrangler dev --config wrangler.c2.jsonc --port 44824 --inspector-port 0
  for p in /plain /boom /boom-async /boom-next /sentinel; do curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:<port>$p; done
All processes I started were killed (wrangler by config-name match, sink by `lsof -ti tcp:44821`).

## Workaround

On plain `wrangler dev` (no Vite plugin, no build-time instrumentation), register the Sentry Express error handler after your routes and before `app.listen`. Because `@sentry/cloudflare` does not re-export it, import it from `@sentry/server-utils` (add it to package.json):

    import { setupExpressErrorHandler } from '@sentry/server-utils';
    const app = express();
    // ... routes ...
    setupExpressErrorHandler(app);
    app.listen(8080);

This captures sync throws, async throws and `next(err)` as `mechanism: auto.middleware.express, handled: false`, trace-linked to the server transaction, under both `traceLifecycle: 'static'` and the default `'stream'`. No hand-written `captureException` middleware is needed, and no lazy app construction is needed on this shape. Route names, handler spans and db spans still require the Vite/build-time-instrumentation shape.

## Docs impact

When running Express behind `httpServerHandler` from `cloudflare:node`, add `setupExpressErrorHandler(app)` after your routes and before `app.listen()` to have route errors reported as unhandled; import it from `@sentry/server-utils` (add it as a dependency) because `@sentry/cloudflare` does not re-export it, so the `Sentry.setupExpressErrorHandler(app)` form shown on the Express guide is `undefined` in a Worker.
