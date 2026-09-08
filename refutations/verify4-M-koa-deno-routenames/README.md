# verify4-M-koa-deno-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-koa-deno` (see `$REPRO/cells/M-koa-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app.ts`, `b-dyn-app.log`, `b-dyn.ndjson`, `b-noerrh-app.log`, `b-noerrh.ndjson`, `b-preload-app.log`, `b-preload-nofix.log`, `b-preload-nofix.ts`, `b-preload.ndjson`, `b-sink.log`, `b-sink.mjs`, `b-sink2.log`, `b-sink3.log`, `b-sink4.log`, `b-stream-app.log`, `b-stream.ndjson`, `b-summarize.mjs`, `ctrl.ts`, `deno.json`, `hook.log`, `instrument.ts`, `json-fix.ts`, `main-dyn-nofix.ts`, `main-dyn.ts`, `main-hook-jsonfix-after.log`, `main-hook-jsonfix-after.ts`, `main-hook-jsonfix-before.log`, `main-hook-jsonfix-before.ts`, `main-hook.ts`, `main-nohook.ts`, `package-lock.json`, `package.json`, `preload.ts`, `probe.ts`, `raw.ndjson`, `rawsink.log`, `rawsink.mjs`, `run-debug.log`, `run-dyn-nofix.log`, `run-preload.log`, `run-static.log`, `run-static.pid`, `run-stream.log`, `run-stream2.log`, `run2.log`, `run283.log`, `run3.log`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Parameterized route names DO appear for Koa on Deno 2.9.0 with @sentry/deno 10.67.0 (develop), under BOTH trace lifecycles, provided (a) the import hook is loaded via `deno run --import=<preload>` rather than as the entry's first `import`, and (b) that preload first registers a `node:module` load hook that serves `.json` with `format: "json"` (works around denoland/deno#36240, the crash the original probe hit).

Probe dir: $SCRATCH/deep/verify4-M-koa-deno-routenames/ (koa 3.2.1, @koa/router 15.7.0, deno 2.9.0, tarball SDK 10.67.0, deno.json nodeModulesDir "manual").

Files: json-fix.ts (the shim), preload.ts (`import "./json-fix.ts"; import "@sentry/deno/import";`), instrument.ts (Sentry.init with tunnel + LIFECYCLE env), app.ts (routes /users/:id, /boom, /sentinel; app.on('error') only when ERR_HANDLER=1), main-nohook.ts (`import "./instrument.ts"; import "./app.ts";`), main-dyn.ts (json-fix + hook + `await import()`), b-sink.mjs (raw envelope sink), logs b-*.log / b-*.ndjson.

--- 1. stream lifecycle, dynamic-import entry (main-dyn.ts), sink b-dyn.ndjson ---
TUNNEL=http://127.0.0.1:47313/ LIFECYCLE=stream APP_PORT=47314 ERR_HANDLER=1 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-dyn.ts
  ORCH= {"runtime":["koa"]}
  SPAN name="/users/:id" op=router seg=false http.route="/users/:id" segname="GET /users/:id" origin=auto.http.koa
  SPAN name="GET /users/:id" op=http.server seg=true http.route="/users/:id" source=route segname="GET /users/:id" origin=auto.http.server
  SPAN name="GET /boom"    op=http.server seg=true http.route="/boom"      source=route
  SPAN name="GET /sentinel" op=http.server seg=true http.route="/sentinel" source=route

--- 2. static lifecycle, `--import=./preload.ts` (main-nohook.ts unchanged), sink b-preload.ndjson ---
TUNNEL=http://127.0.0.1:47315/ LIFECYCLE=static APP_PORT=47316 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --import=./preload.ts main-nohook.ts
  TRANSACTION name="GET /users/:id" source=route op=http.server http.route="/users/:id"
      span op=router desc="/users/:id" route="/users/:id" origin=auto.http.koa
  TRANSACTION name="GET /boom"     source=route op=http.server http.route="/boom"
  TRANSACTION name="GET /sentinel" source=route op=http.server http.route="/sentinel"

--- 3. bonus, same run shape WITHOUT the manual app.on('error') (b-noerrh.ndjson): the Koa integration's own error handler fires, so point (5) of the reported wiring is unnecessary too ---
  TRANSACTION name="GET /boom" source=route route="/boom" spans=router /boom
  EVENT "koa boom" transaction="GET /boom" mech=auto.middleware.koa handled=false

--- What the original probe hit, reproduced and explained ---
(a) `--import=./b-preload-nofix.ts` (hook only, no JSON shim) still dies before listen:
  error: Uncaught (in promise) SyntaxError: Unexpected token ':'
  var codes = require('./codes.json')
      at Object.<anonymous> (.../node_modules/statuses/index.js:15:13)
(b) The documented shape `import "@sentry/deno/import"` as the entry's first line does NOT instrument Koa even once the JSON shim is added: it boots, but Koa is never transformed. Both orders were tried (main-hook-jsonfix-before.ts and main-hook-jsonfix-after.ts), both print `ORCH= {"runtime":[]}`, and the stream run then yields exactly the reported symptom:
  SPAN name="GET" op=http.server seg=true http.route=undefined source=url segname="GET"
Deno source-loads the whole static ESM graph (including the npm CJS facades) before the entry's first statement runs, so the injection hook registers too late; only `--import` / `await import()` defers Koa past hook registration.

Deno 2.8.3 (CI pin) was not tested: $SCRATCH/deno283/deno does not exist on this machine.

## Workaround

Two changes to the reported wiring, both in user land, no SDK change:

1. preload.ts
   import "./json-fix.ts";
   import "@sentry/deno/import";

   json-fix.ts (works around denoland/deno#36240: with any `node:module` hook registered, Deno compiles CJS `require('*.json')` as JS):
   import { registerHooks } from "node:module";
   import { readFileSync } from "node:fs";
   import { fileURLToPath } from "node:url";
   registerHooks({
     load(url, context, nextLoad) {
       if (url.endsWith(".json")) {
         return { format: "json", source: readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
       }
       return nextLoad(url, context);
     },
   });

2. Load it with the flag, not as an entry import:
   deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --import=./preload.ts main.ts
   where main.ts is just `import "./instrument.ts"; import "./app.ts";`
   (Equivalent alternative: keep the imports in main.ts but make the app load dynamic, `import "./json-fix.ts"; import "@sentry/deno/import"; await import("./instrument.ts"); await import("./app.ts");`)

With this, `http.route` and the `GET /users/:id` name with source `route` appear in both `stream` and `static` lifecycles, Koa `router` spans appear, and the Koa auto error handler works, so the manual `app.on("error", ...)` from the reported wiring can be dropped.

## Docs impact

On Deno, Koa instrumentation (and with it the `http.route` attribute and the parameterized `GET /users/:id` transaction name) needs the Sentry import hook to be loaded through `deno run --import=./preload.ts` rather than as the first `import` of the entry file, because Deno loads the entry's whole static module graph, Koa included, before the entry's first statement runs, and that preload must register a `node:module` `registerHooks` load hook returning `.json` files with `format: "json"` first, otherwise Koa's `statuses` dependency aborts the process with `SyntaxError: Unexpected token ':'` (denoland/deno#36240).
