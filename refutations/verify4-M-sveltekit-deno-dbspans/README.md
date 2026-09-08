# verify4-M-sveltekit-deno-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-sveltekit-deno` (see `$REPRO/cells/M-sveltekit-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `jsontest/`, `node-probe/`, `runA.log`, `runA.pid`, `runB.log`, `runB.pid`, `runC.log`, `runC.pid`, `runD.log`, `runD.pid`, `runE.log`, `runE.pid`, `runF.log`, `runF.pid`, `runG.log`, `runG.pid`, `sink-b.log`, `sink-b.pid`, `sink.log`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. SvelteKit 2 + adapter-node on Deno 2.9.0 with @sentry/sveltekit 10.67.0 (develop) does emit `db` spans, in both trace lifecycles. The report's two claims come apart: the mysql2 500 is real, but it is a Deno bug (denoland/deno#36240), not the absence of db instrumentation, and it does not affect the `mysql` driver at all.

Probe dir: $SCRATCH/deep/verify4-M-sveltekit-deno-dbspans/
  app/                     SvelteKit 2.70 + adapter-node 5.5 + svelte 5 + vite 6, wiring identical to the report (sentrySvelteKit from '@sentry/sveltekit/vite', mysql/mysql2 + @sentry/* external, Sentry.init at the top of src/hooks.server.js, sentryHandle + handleErrorWithSentry)
  app/src/lib/db.js        module-scope `mysql2/promise` connection      -> route /db
  app/src/routes/db2/+server.js  `mysql` v2 connection inside the handler -> route /db2
  app/prewarm-json.mjs     the one-line workaround, used via `deno run --preload`
  jsontest/t.mjs           minimal repro: registerHooks pass-through + require('*.json')
  runD.log (no workaround, stream), runE.log (workaround, stream), runF.log (workaround, static), runG.log (--preload workaround, stream), runA.log/runB.log (earlier runs, same conclusions)

1) The `mysql` driver needs NO change whatsoever. Unmodified reported setup, `LIFECYCLE=stream`, sink on 41777:
   ping -> pong [200]
   db  -> {"message":"Internal Error"} [500]
   db2 -> {"driver":"mysql","rows":2} [200]
   sink:
     span  ['http.server GET /ping']
     span  ['db SELECT users', 'http.server GET /db2']
     span  ['http.server GET /sentinel']
   raw: {"name": "SELECT users", "status": "ok", "parent_span_id": "...", "origin": "auto.db.mysql"}
   So "no db span" is wrong even in the exact configuration the report ran.

2) mysql2 works too once Deno's JSON bug is sidestepped. Warm mysql2's package.json into the CJS require cache before Sentry registers its hooks. Two equivalent forms, both verified:
   a) run flag only, no app code change (runG):
      HOST=127.0.0.1 PORT=41784 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi \
        --preload ./prewarm-json.mjs build/index.js
      where prewarm-json.mjs is:  import { createRequire } from 'node:module'; createRequire(import.meta.url)('mysql2/package.json');
   b) the same two lines at the very top of src/hooks.server.js, above the `Sentry.init` import.
   Result (stream, runG):  db -> {"driver":"mysql2","rows":2} [200]
     span ['db SELECT users', 'http.server GET /db']
     span ['db SELECT users', 'http.server GET /db2']
   raw origin for /db: "auto.db.mysql2.diagnostic_channel"  <- the SDK's channel injection really did instrument mysql2 on Deno
   Result (static, runF): {"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["db SELECT id, name FROM users"]}
                          {"type":"transaction","name":"GET /db2",...,"spans":["db SELECT id, name FROM users"]}

3) The crash is Deno's, not the SDK's. jsontest/t.mjs registers a pass-through `Module.registerHooks({resolve,load})` with no Sentry anywhere:
   -- deno 2.9.0 no hook:            json ok: {"a":1}
   -- deno 2.9.0 with pass-through hook: json FAIL: SyntaxError Unexpected token ':'
   -- node 26 with hook:             json ok: {"a":1}
   Any library that `require()`s a .json at runtime breaks under Deno the moment anything registers sync module hooks. mysql2 does that at connection_config.js:13; `mysql` v2 does not, which is the whole difference between /db and /db2.

Two secondary observations that stand independent of the verdict:
- `[instrumentation] failed to inject diagnostics-channel into mysql2: TypeError: transform is not a function` is printed on every run, together with the always-on "`@sentry/server-runtime-injection` was bundled into your application" warning, yet the package is NOT bundled (the stack points at app/node_modules/@sentry/server-runtime-injection/build/esm/vendored/...) and mysql2 IS instrumented (origin auto.db.mysql2.diagnostic_channel). One mysql2 file fails to transform under Deno while the ones that matter succeed, so the always-on warning is a false alarm here and sends users down the wrong path.
- `[Sentry] Runtime hook registered, injected libraries=[]` is logged before any library loads, so it never reflects reality.

## Workaround

Prime mysql2's package.json in the CJS require cache before Sentry's module hooks are installed. Either add a preload file and start the server with it (no app change):
  // prewarm-json.mjs
  import { createRequire } from 'node:module';
  createRequire(import.meta.url)('mysql2/package.json');
  HOST=127.0.0.1 PORT=<p> deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi --preload ./prewarm-json.mjs build/index.js
or put the same two lines at the very top of src/hooks.server.js, above the `@sentry/sveltekit` import and `Sentry.init`. The `mysql` (v2) driver needs no workaround at all. Both give a `db` span parented under the SvelteKit `http.server` span, in `traceLifecycle: 'stream'` and `'static'`.

## Docs impact

On Deno, database spans work for SvelteKit adapter-node builds (verified for `mysql` and `mysql2`), but a Deno bug (denoland/deno#36240) makes `require()` of a JSON file fail once the SDK installs its module hooks, so drivers that read their own package.json at runtime — mysql2 among them — throw `SyntaxError: Unexpected token ':'` on first use; load that JSON into the require cache before the SDK initializes, with a `--preload` file (or two lines at the top of `src/hooks.server.js`) containing `createRequire(import.meta.url)('mysql2/package.json')`, and note that the `@sentry/server-runtime-injection` "was bundled into your application" warning can fire spuriously on Deno even when instrumentation is working.
