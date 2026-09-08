# verify4-M-koa-deno-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-koa-deno` (see `$REPRO/cells/M-koa-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `deno.json`, `instrument.ts`, `koa-app.ts`, `main-a-nohook.ts`, `main-b-hook.ts`, `main-c-koafirst.ts`, `main-d-koafirst-conn.ts`, `main-e.ts`, `mkquery-conn.ts`, `mkquery.ts`, `package-lock.json`, `package.json`, `run-a.log`, `run-b.log`, `run-c.log`, `run-d.log`, `run-e-static.log`, `run-e-stream.log`, `run-e2-stream.log`, `run2-a1.log`, `run2-a2.log`, `run2-c2.log`, `run2.sh`, `run2.sh.bak`, `run3-c3.log`, `run3-d3.log`, `run3-e3.log`, `run3-e3s.log`, `run3.sh`, `sink-a1.log`, `sink-a2.log`, `sink-c2.log`, `sink-c3.log`, `sink-d3.log`, `sink-e3.log`, `sink-e3s.log`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Koa 3.2.1 + @koa/router 15.7.0 on Deno 2.9.0 with @sentry/deno 10.67.0 (develop tarballs) DOES produce a mysql db span that is a proper child of the Koa request transaction. Two changes to the original probe's wiring are needed, and the second one is the reason the original probe saw no usable span even in its Koa-free control.

CHANGE 1 - register the import hook AFTER Koa's module graph is loaded, not as the first import.
The hook is a Deno module-load hook: it only transforms modules loaded after it is registered. Koa's `statuses` package does `require('./codes.json')`, which the hook cannot handle (Deno bug denoland/deno#36240), so `import "@sentry/deno/import"` as line 1 kills the process. But if Koa is imported statically first and the hook is then registered with a top-level `await import("@sentry/deno/import")`, Koa is already in the module cache and never re-transformed, while `mysql` - dynamically imported after the hook - IS transformed and instrumented.

CHANGE 2 - use `mysql.createConnection`, not `mysql.createPool`.
With `createPool` the db span is emitted but as its own ROOT transaction in a DIFFERENT trace from the request. This is what the original probe hit in its node:http control, and it is NOT a Koa or node:http problem: with the exact same entry, same hook ordering and same Koa app, swapping `createPool` for `createConnection` moves the span onto the request transaction. Every pooled query in the process also shared one single trace_id, i.e. the pool's queries run in the async context captured when the pool was built, not the request's. The repo's own e2e app (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/deno-mysql/src/app.ts) uses `createConnection` for exactly this reason (its comments call out the AsyncLocalStorage restore in `denoMysqlIntegration`).

Context propagation inside the Koa handler itself is fine either way: a `/manual` route reported `{"hadActiveSpan":true}` and its manual span nested correctly (`"spans":["manual manual-child"]`), so the detachment is specific to the pooled driver path.

=== SINK LINES ===

A) Baseline, no hook (main-a-nohook.ts, static) - reproduces the original claim:
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"419a69126b2546daa96eb1d9121ee2dd","sdk":"sentry.javascript.deno","spans":[]}

B) Documented ordering, hook first (main-b-hook.ts) - still crashes, confirmed on this run:
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
var codes = require('./codes.json')
    at Object.<anonymous> (.../verify4-M-koa-deno-dbspans/node_modules/statuses/index.js:15:13)

C) Late hook + createPool (main-c-koafirst.ts, static) - db span exists but detached, and both requests' db spans share one trace_id:
{"type":"transaction","name":"SELECT name FROM users LIMIT 1","op":"db","source":"custom","status":"ok","trace_id":"b8c50373ca7d4348a101bdbc9f18996f","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"b0bb774d3cd84660bb397977764e5d88","spans":[]}
{"type":"transaction","name":"SELECT name FROM users LIMIT 1","op":"db","source":"custom","status":"ok","trace_id":"b8c50373ca7d4348a101bdbc9f18996f","spans":[]}
{"type":"transaction","name":"GET /manual","op":"http.server","source":"url","status":"ok","trace_id":"361ab9f7ca4e45919d9214b921abbc8b","spans":["manual manual-child"]}

D) Late hook + createConnection (main-d-koafirst-conn.ts, static) - WORKS:
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"170179a7b6714caa87c9e17f2b2e2115","sdk":"sentry.javascript.deno","spans":["db SELECT name FROM users LIMIT 1"]}
{"type":"transaction","name":"GET /db-in-span","op":"http.server","source":"url","status":"ok","trace_id":"3e9481c75a5b40618e10181f765821e9","spans":["manual wrapper","db SELECT name FROM users LIMIT 1"]}

E) Sentry.init FIRST, then Koa, then hook, then mysql (main-e.ts, static) - WORKS, so the docs' "init before everything" rule is preserved:
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"be34597ee1e04af1828f3fa0bbdd392d","spans":["db SELECT name FROM users LIMIT 1"]}

F) Same entry, traceLifecycle "stream" (main-e.ts) - WORKS, db span parented in the same trace as the server segment:
{"type":"span","trace_id":"ba3473b362824eb9964c42b9de9b1b5f","items":["db SELECT users","http.server GET"],"raw":[{"name":"SELECT users","status":"ok","parent_span_id":"ba84105fe34292af","is_segment":false,"origin":"auto.db.mysql"},{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.server"}]}

=== HOW TO RERUN ===
Dir: $SCRATCH/deep/verify4-M-koa-deno-dbspans/
node_modules was removed after the run; restore with `npm install` in that dir (package.json/package-lock.json point at $REPRO/_toolbox/pack/sentry-{deno,core,server-utils,server-runtime-injection}-10.67.0.tgz plus koa@3.2.1, @koa/router@15.7.0, mysql@2.18.1).
Then: ./run3.sh ./main-e.ts static <tag> /db /db-in-span   (and ./run3.sh ./main-e.ts stream <tag> /db)
run3.sh starts $REPRO/_toolbox/sink.mjs on a random port, boots the app, drives /db, waits for a captureMessage sentinel, prints the sink items and kills both processes.
Files: main-a-nohook.ts (baseline), main-b-hook.ts (documented ordering, crashes), main-c-koafirst.ts (late hook + pool), main-d-koafirst-conn.ts (late hook + connection), main-e.ts (init first + late hook + connection), koa-app.ts (routes /db, /db-in-span, /manual, /sentinel), mkquery.ts (pool), mkquery-conn.ts (connection), deno.json (nodeModulesDir "manual"), run3.sh, logs run3-*.log / sink-*.log.
Command shape: PORT=<app> SINK=<sink> LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys ./main-e.ts

## Workaround

main.ts (the whole fix, both parts):

  import './instrument.ts';                       // Sentry.init - still first
  import { makeApp } from './app.ts';             // Koa + @koa/router load here, BEFORE the hook

  await import('@sentry/deno/import');            // hook registered late, so it never sees Koa's require('*.json')
  const mysql = (await import('mysql')).default;  // driver imported AFTER the hook -> instrumented

  const connection = mysql.createConnection({ host, port, user, database });  // NOT createPool
  connection.connect(err => err && console.error(err));
  makeApp(connection).listen(port);

Do not use `mysql.createPool`: pooled queries emit a db span in a detached trace of their own instead of on the request transaction. Everything else the original probe reported still holds - @sentry/deno has no `setupKoaErrorHandler`, so keep the hand-written `app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'manual.koa.onerror', handled: false } }))`, and the server span is still named from the URL (static) or method-only (stream) because there is no Koa router integration.

## Docs impact

On Deno, a Koa app cannot put `import "@sentry/deno/import"` first (Deno fails on `require('*.json')` inside Koa's `statuses` dependency, denoland/deno#36240): import your Koa app module first, then register the hook with a top-level `await import("@sentry/deno/import")` and dynamically `await import()` your database driver after it - and create the driver client with `mysql.createConnection`, since queries made through `mysql.createPool` produce a db span in a separate trace instead of on the request transaction.
