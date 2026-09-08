# D18 - Deno hook with nodeModulesDir variants

Runtime: deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

Three copies of the same tiny Deno app (`main.ts` in `no-node-modules-dir/`, `auto/` and `manual/`,
byte-identical copies of `app.ts`) load the Deno module hook with `import "@sentry/deno/import";` as
their first line, init `@sentry/deno` against a local envelope sink with `traceLifecycle: "static"`,
import `mysql@2`, open a module-scope connection and serve `/db` (runs `SELECT id, name FROM users`),
`/orch` (dumps `globalThis.__SENTRY_ORCHESTRION__` and the Deno version) and `/sentinel`. The only
difference between the three is the `deno.json`: no `nodeModulesDir` at all (so `mysql` resolves from
Deno's global npm cache), `"nodeModulesDir": "auto"` (Deno materialises `node_modules/.deno/...`) and
`"nodeModulesDir": "manual"` (the `npm install`ed `node_modules` is used as-is). Each variant prints
where `mysql` resolved from and the orchestrion marker before and after the `mysql` import, so it is
visible whether the hook injected the diagnostics channels, and the sink shows whether the `db` span
made it into the `GET /db` transaction.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

(`package.json` points `@sentry/{deno,core,server-utils,server-runtime-injection}` at the tarballs in
`../../_toolbox/pack/` and adds `mysql@2`. `manual/node_modules` is a symlink to this `node_modules`,
because `nodeModulesDir: "manual"` looks for `node_modules` next to its own `deno.json`.)

Needs the MariaDB from the toolbox on `127.0.0.1:3307` (`root`, no password, db `app`, table `users`).

## Run

From this directory (pick free ports; check with `lsof -nP -iTCP:<port>`):

```
PORT=48271 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
./run.sh no-node-modules-dir 48271 41831 1 > run-no-nmd.log 2>&1
./run.sh auto               48271 41832 0 > run-auto.log 2>&1
./run.sh manual             48271 41833 0 > run-manual.log 2>&1
kill $spid; wait $spid
grep -E 'MYSQL_RESOLVED|ORCH_|GET /orch|transaction' run-no-nmd.log run-auto.log run-manual.log
```

`run.sh <variant> <sink-port> <app-port> [debug 0|1]` clears the sink, starts the variant with
`SINK_PORT=.. APP_PORT=.. SENTRY_DEBUG=.. deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --config <variant>/deno.json <variant>/main.ts`,
waits for `APP_READY`, runs `node drive.mjs <app-port> <sink-port>` (GET `/db`, `/orch`, `/sentinel`,
then polls the sink until the `sentinel` event has arrived), kills the app and prints
`<variant>/app.log`. `sink.mjs` is `_toolbox/sink.mjs` unchanged.

## Expected

Recorded verdict: **partial**.

(1) With no `nodeModulesDir` (mysql loaded from the global npm cache): no db span,
`__SENTRY_ORCHESTRION__.runtime` stays `[]` after mysql is imported, and with `debug: true` the SDK
prints no warning at all (the Deno SDK never calls `detectOrchestrionSetup`; `packages/deno/src` has
no reference to it). (2) `nodeModulesDir: "auto"` and (3) `nodeModulesDir: "manual"` with a prepared
`node_modules`: db span present, `runtime` is `["mysql"]`. A control run with the same path-mapped
imports but `nodeModulesDir: "auto"` also injects, so the deciding factor is only where mysql
resolves from (node_modules vs npm cache), not how `@sentry/deno` was mapped.

Recorded evidence lines:

```
(1) develop/npm-cache, debug=1:
ORCH_AFTER_IMPORT_HOOK={"runtime":[]}
Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:mysql] subscribing to channels
MYSQL_RESOLVED=file://~/Library/Caches/deno/npm/sfw.security.sentry.io/npm/mysql/2.18.1/index.js
ORCH_AFTER_MYSQL_IMPORT={"runtime":[]}
GET /orch -> {"orchestrion":{"runtime":[]},"deno":"2.9.0"}
SINK: {"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]}
grep -in "warn\|injection detected" app.log -> (no lines)

(2) develop/auto (links to worktree packages):
MYSQL_RESOLVED=file:///.../deep/D18/attempt2/develop/auto/node_modules/.deno/mysql@2.18.1/node_modules/mysql/index.js
ORCH_AFTER_MYSQL_IMPORT={"runtime":["mysql"]}
GET /orch -> {"orchestrion":{"runtime":["mysql"]},"deno":"2.9.0"}
SINK: {"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":["db SELECT id, name FROM users"]}

(3) develop/manual (symlinked node_modules):
MYSQL_RESOLVED=file://$SDK/node_modules/mysql/index.js
ORCH_AFTER_MYSQL_IMPORT={"runtime":["mysql"]}
GET /orch -> {"orchestrion":{"runtime":["mysql"]},"deno":"2.9.0"}
SINK: {"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":["db SELECT id, name FROM users"]}
```

## Observed on 2026-09-07

Matches the recorded verdict. Sink ports 47318, app ports 41931/41932/41933.

```
== no-node-modules-dir (debug=1)
GET /db -> 200 {"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
GET /orch -> {"orchestrion":{"runtime":[]},"deno":"2.9.0"}
SINK:
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.deno","spans":[]}
ORCH_AFTER_IMPORT_HOOK={"runtime":[]}
Sentry Logger [log]: [instrumentation:mysql] Bun/Deno, subscribing eagerly
Sentry Logger [log]: [instrumentation:mysql] subscribing to channels
MYSQL_RESOLVED=file://~/Library/Caches/deno/npm/sfw.security.sentry.io/npm/mysql/2.18.1/index.js
ORCH_AFTER_MYSQL_IMPORT={"runtime":[]}
grep -in "warn\|injection detected" no-node-modules-dir/app.log -> (no lines)

== auto (debug=0)
GET /orch -> {"orchestrion":{"runtime":["mysql"]},"deno":"2.9.0"}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.deno","spans":["db SELECT id, name FROM users"]}
MYSQL_RESOLVED=file://$REPRO/probes/D18/auto/node_modules/.deno/mysql@2.18.1/node_modules/mysql/index.js

== manual (debug=0)
GET /orch -> {"orchestrion":{"runtime":["mysql"]},"deno":"2.9.0"}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.deno","spans":["db SELECT id, name FROM users"]}
MYSQL_RESOLVED=file://$REPRO/probes/D18/node_modules/mysql/index.js
```

Full output of the run is in `run-no-nmd.log`, `run-auto.log` and `run-manual.log`.

Two deviations from the recorded run, neither of which changes the verdict:

- The original variant (2) used Deno `links` to the worktree packages, which are not part of this
  repro. This rebuild uses the record's own control setup instead: `@sentry/*` bare specifiers are
  mapped to the installed tarball build files in every variant, and only `nodeModulesDir` differs.
  The record states that the control (`nodeModulesDir: "auto"` with path-mapped imports) injects
  mysql just like the `links` variant, which is what `auto/` shows here.
- `ORCH_AFTER_MYSQL_IMPORT` prints `{"runtime":[]}` in `auto/` and `manual/` where the record has
  `{"runtime":["mysql"]}`. This app reaches mysql through `await import("mysql")`, so the CJS module
  is transformed after that line has printed; `/orch`, served later, reports `["mysql"]` in both
  variants, and the db span is recorded, so injection did happen.

`@opentelemetry/api` is mapped to `npm:@opentelemetry/api@1` rather than to a file path: its ESM
build uses extensionless relative imports, which Deno rejects when the package is loaded by path.
