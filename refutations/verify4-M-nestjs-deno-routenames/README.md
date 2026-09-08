# verify4-M-nestjs-deno-routenames

## What it re-tests

Independent re-test of the capability **routenames** of cell `M-nestjs-deno` (see `$REPRO/cells/M-nestjs-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `A-static.log`, `B-stream.log`, `C-baseline.log`, `D-after.log`, `E-fastify-noinject-fix.log`, `F-fastify-fix.log`, `G-formatjson.log`, `R1-noinject-static.log`, `R2-jsonfix-static.log`, `R3-jsonfix-stream.log`, `R4-jsonfix-stream-attrs.log`, `R5-deno283-default.log`, `R6-default-noworkaround.log`, `R7-jsonfix-after-init.log`, `app.module.ts`, `app.pid`, `app2.module.ts`, `app2.pid`, `app2b.pid`, `app2c.pid`, `app2d.pid`, `app2e.pid`, `app2f.pid`, `app2g.pid`, `deno.json`, `instrument-after.ts`, `instrument.ts`, `instrument2.ts`, `instrument3.ts`, `main-after.ts`, `main-fastify.ts`, `main.ts`, `main2.ts`, `main3.ts`, `package-lock.json`, `package.json`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `sink3.log`, `sink3.mjs`, `sink3.pid`, `try-hooks-diag.mjs`, `try-hooks-jsonfix.mjs`, `try-hooks-none.mjs`, `try-hooks-noop.mjs`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. NestJS 10 (@nestjs/core + @nestjs/platform-express, and also @nestjs/platform-fastify) with @sentry/nestjs 10.67.0 (develop) on Deno 2.9.0 produces fully parameterized route names, source "route", express/nest middleware+handler spans, and error events — with diagnostics-channel injection LEFT ON. The previous agent's `__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true }` workaround is not needed and is what cost them route names.

The real blocker is narrower than reported: on Deno 2.9.0 any registered module hook makes `nextLoad()` return `format: undefined` for a `.json` URL, so Deno compiles the JSON as JS (`SyntaxError: Unexpected token ':'` in statuses/codes.json). Sentry's own hook is innocent — its `loadSync` (node_modules/@sentry/server-runtime-injection/build/esm/vendored/@apm-js-collab/tracing-hooks/hook.js:113-126) just calls `nextLoad` and returns the result untouched for non-instrumented URLs. Registering one compensating hook that restores the JSON format repairs it, and Sentry's injection then works normally.

The change (6 lines, in instrument.ts, before the `@sentry/nestjs` import or right after `Sentry.init()` — both orders verified):

  import * as Module from "node:module";
  (Module as any).registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      return url.endsWith(".json") ? { ...result, format: "json" } : result;
    },
  });

(A variant that reads the file and returns `{ format: "commonjs", source: "module.exports = " + src, shortCircuit: true }` works identically.)

Isolation of the Deno bug (no Sentry, $D/try-hooks-*.mjs, deno 2.9.0):
  -- try-hooks-none      STATUSES_OK function
  -- try-hooks-noop      STATUSES_FAIL Unexpected token ':'
  -- try-hooks-jsonfix   STATUSES_OK function Not Found
  -- try-hooks-diag      LOAD json url=.../statuses/codes.json format= undefined srcType= string hasSource= true  /  STATUSES_OK function

Sink, express platform, injection ON, JSON_FIX hook, traceLifecycle "static" (A-static.log):
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.nestjs","spans":["middleware query","middleware expressInit","middleware jsonParser","middleware urlencodedParser","handler /users/:id","function AppController.getUser","handler getUser"]}
  {"type":"transaction","name":"GET /fail/:id","op":"http.server","source":"route","status":"internal_error", "spans":[... "handler /fail/:id","function AppController.fail","handler fail","middleware SentryGlobalFilter"]}
  {"type":"event","exception":"Error: boom 7","mechanism":"auto.http.nestjs.global_filter","handled":false,"transaction":"GET /fail/:id"}

Same app, traceLifecycle "stream" (B-stream.log), segment span:
  {"name":"GET /users/:id","status":"ok","is_segment":true,"origin":"auto.http.http_server"}
  attributes: "sentry.segment.name.source":"route", "http.route":"/users/:id", "sentry.segment.name":"GET /users/:id"
  child spans: middleware query/expressInit/jsonParser/urlencodedParser, handler /users/:id, function AppController.getUser (origins auto.http.express / auto.http.nestjs)

@nestjs/platform-fastify, injection ON, same hook (F-fastify-fix.log):
  transaction | GET /users/:id | route | ["handler GET /users/:id","middleware fastify -> @fastify/middie - onRequest","handler fastify -> @fastify/middie - route-handler","function AppController.getUser","handler getUser"]

Baselines that reproduce their report: injection ON without the hook fails to boot — express (C-baseline.log: `[Nest] ERROR [PackageLoader] No driver (HTTP) has been selected...`) and fastify (E-fastify-noinject-fix.log: `SyntaxError: Unexpected token ':'`).

Probe files (all absolute, rerunnable, node_modules kept): $SCRATCH/deep/verify4-M-nestjs-deno-routenames/ — instrument.ts (JSON_FIX=1 source-rewrite hook, JSON_FIX=2 format-only hook, NO_INJECT=1 their workaround), instrument-after.ts/main-after.ts (hook registered after Sentry.init), app.module.ts, main.ts, main-fastify.ts, try-hooks-{none,noop,jsonfix,diag}.mjs, deno.json, logs A-G.
Commands:
  npm install @nestjs/core@10 @nestjs/common@10 @nestjs/platform-express@10 @nestjs/platform-fastify@10 reflect-metadata rxjs mysql2 $REPRO/_toolbox/pack/sentry-{nestjs,node,core,server-utils,server-runtime-injection,opentelemetry}-10.67.0.tgz
  PORT=41983 node $REPRO/_toolbox/sink.mjs &
  SINK_PORT=41983 APP_PORT=41984 JSON_FIX=2 LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts
  curl -s http://127.0.0.1:41984/users/42 ; curl -s http://127.0.0.1:41984/fail/7
Reference app read: ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/nestjs-basic (instrument.ts + SentryModule.forRoot() + explicit APP_FILTER SentryGlobalFilter) — the same wiring, unchanged, is what I ran on Deno.
Not tested: Deno 2.8.3 (the CI pin is not present on this machine; $SCRATCH/deno283 does not exist), so I cannot say whether the JSON-format regression exists there too.

Workaround: Keep diagnostics-channel injection ON and neutralize the Deno JSON-loader bug instead. In instrument.ts (works before the `@sentry/nestjs` import or immediately after `Sentry.init()`):

import * as Module from "node:module";
(Module as any).registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context);
    return url.endsWith(".json") ? { ...result, format: "json" } : result;
  },
});

Then the documented Nest wiring (SentryModule.forRoot() + APP_FILTER SentryGlobalFilter) yields "GET /users/:id" with source "route" on both traceLifecycle "static" and "stream", on platform-express and platform-fastify. Do NOT set `__SENTRY_ORCHESTRION__ = { runtimeUnavailable: true }`; that disables the instrumentation that produces route names. Better still, the SDK can carry this itself: `loadSync` in @sentry/server-runtime-injection's vendored tracing-hooks should restore `format: "json"` for `.json` URLs whose `nextLoad` result has no format (Deno only), which removes the user-side workaround entirely.

Docs impact: On Deno 2.9.0, any registered module hook makes Deno load `.json` files without a format, so a Nest app crashes at startup with `SyntaxError: Unexpected token ':'` (statuses/codes.json) once Sentry registers its diagnostics-channel hooks; add a `Module.registerHooks({ load(url, ctx, next) { const r = next(url, ctx); return url.endsWith('.json') ? { ...r, format: 'json' } : r; } })` shim to your `instrument.ts` — do not disable Sentry's injection, because that is what provides parameterized route names (`GET /users/:id`, source `route`) for Express and Fastify Nest apps.
