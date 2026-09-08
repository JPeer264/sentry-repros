# D15 - mysql2 driver on Deno with the hook

Runtime: Deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`) |
mysql2 3.23.3 in this directory, mysql2 3.15.0 in `m315/`

## What it reproduces

One Deno app (`app.ts`) opens a module-scope `mysql2/promise` pool against the MariaDB on
`127.0.0.1:3307` and serves three routes: `/users` runs `SELECT * FROM users` through the pool,
`/users-conn` opens a per-request `mysql.createConnection` and runs the same query on it, and
`/sentinel` captures the message event the runner waits for before dumping the sink. Two entries
load that app: `main-hook.ts` puts `import "@sentry/deno/import"` on its first line (the
`@sentry/server-runtime-injection` loader hook that is supposed to instrument mysql2 on Deno), and
`main-nohook.ts` omits it. The probe asks whether the hook is what makes mysql2 traceable on Deno.
It shows the opposite: with the hook the app never reaches `Deno.serve`, because the hook makes
mysql2's `require('../package.json')` throw `SyntaxError: Unexpected token ':'` (K3,
denoland/deno#36240), while without the hook develop's default `mysql2Integration` picks up mysql2's
native `node:diagnostics_channel` tracing channels and emits `db` spans - but only for mysql2
>= 3.20.0, which is what the `m315/` copy (mysql2 3.15.0) contrasts against.

## Install

From this directory, and again from `m315/`:

```
npm install --no-audit --no-fund
```

Both `package.json` files point at the `_toolbox/pack` tarballs by relative path, so this installs
`@sentry/{deno,core,server-utils,server-runtime-injection}` 10.67.0 plus the pinned mysql2. Each
`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses exactly the `node_modules` next to it.
MariaDB must be reachable on `127.0.0.1:3307` (user `root`, no password, database `app`, table
`users`).

## Run

From this directory (ports are free-choice; check they are unused first). `run.sh` starts its own
sink, so no separate sink command is needed:

```
./run.sh main-hook    51818 51817 hook
./run.sh main-nohook  51816 51815 nohook
cd m315
./run.sh main-hook    51820 51819 m315-hook
./run.sh main-nohook  51822 51821 m315-nohook
```

`run.sh <entry> <app port> <sink port> <label>` starts `PORT=<sink port> node sink.mjs`, starts

```
APP_PORT=<app port> SINK_PORT=<sink port> \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys <entry>.ts
```

waits for the app to answer, curls `/users`, `/users-conn` and `/sentinel`, waits for the sentinel
event and then for the streamed span envelopes, writes `items-<label>.json` and `app-<label>.log`,
prints both, and kills the app and the sink. `sink.mjs` is `_toolbox/sink.mjs` with the span mapping
changed to keep each span's full attribute bag instead of the default `"<op> <name>"` string;
`summarize.mjs` renders `items-<label>.json` as the trimmed evidence lines below
(`node summarize.mjs items-nohook.json`). An optional fifth argument to `run.sh` is a different
`deno` binary.

## Expected

Recorded verdict: **broken**.

With the hook (`import "@sentry/deno/import"` as the first line) the app never starts: importing
`mysql2/promise` crashes at `mysql2/lib/connection_config.js:13` with `SyntaxError: Unexpected token
':'` on `require('../package.json')` (K3, denoland/deno#36240), on both Deno 2.9.0 and 2.8.3 and for
mysql2 3.23.3 as well as 3.15.0. Just before the crash the SDK prints a misleading warning claiming
`@sentry/server-runtime-injection` was bundled. Without the hook the claim is also wrong: mysql2
>= 3.20.0 publishes native `node:diagnostics_channel` tracing channels, and develop's default
`mysql2Integration` subscribes to them eagerly, so `db SELECT users` spans with `db.query.text` and
`db.system.name=mysql` arrive (plus `mysql2.pool.connect`/`mysql2.connect` spans) for both the
module-scope pool and the per-request connection; with mysql2 3.15.0 (< 3.20.0, orchestrion path)
there are no db spans without the hook.

Recorded evidence lines:

```
WITH HOOK (deno 2.9.0 and 2.8.3, mysql2 3.23.3 and 3.15.0), app log:
[Sentry] `@sentry/server-runtime-injection` was bundled into your application, so mysql2 and any other instrumented dependency load uninstrumented. Keep `@sentry/server-runtime-injection` external in your server bundle, or use the Sentry bundler plugin for build-time instrumentation. See https://docs.sentry.io/platforms/javascript/guides/node/troubleshooting/
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const { version } = require('../package.json');
    at Object.<anonymous> (file://$SDK/node_modules/mysql2/lib/connection_config.js:13:21)
(no sink items; server never listened)

WITHOUT HOOK (mysql2 3.23.3, deno 2.9.0), sink:
/users (module-scope pool): {"type":"span","items":[{"span":"db mysql2.pool.connect","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"db mysql2.connect",...},{"span":"db SELECT users","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server",...}}]}
/users-conn (per-request createConnection): {"type":"span","items":[{"span":"db mysql2.connect",...},{"span":"db SELECT users","attrs":{..."db.query.text":"SELECT * FROM users","db.system.name":"mysql",...}},{"span":"http.server GET",...}]}
{"type":"event","message":"sentinel",...,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"}}

WITHOUT HOOK (mysql2 3.15.0, develop-m315): only {"type":"span","items":[{"span":"http.server GET",...}]} x3, no db spans.
```

## Observed on 2026-09-07

Matches the recorded verdict (**broken**), on the first run, for all four combinations. Verbatim
trimmed output of the runs above (`app-hook-clean.log`, `evidence-*.txt`; full sink dumps in
`items-*.json`):

```
WITH HOOK (deno 2.9.0, mysql2 3.23.3), app-hook-clean.log:
[Sentry] `@sentry/server-runtime-injection` was bundled into your application, so mysql2 and any other instrumented dependency load uninstrumented. Keep `@sentry/server-runtime-injection` external in your server bundle, or use the Sentry bundler plugin for build-time instrumentation. See https://docs.sentry.io/platforms/javascript/guides/node/troubleshooting/
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const { version } = require('../package.json');
                    ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Module._compile (node:module:1691:23)
    at Module.load (node:module:1572:16)
    at Module._load (node:module:1274:14)
    at Module.require (node:module:1609:19)
    at require (node:module:1815:16)
    at Object.<anonymous> (file://$REPRO/probes/D15/node_modules/mysql2/lib/connection_config.js:13:21)
run.sh: --- app never listened on 51818
evidence-hook.txt (the only sink item):
{"type":"event","exception":"SyntaxError: Unexpected token ':'","mechanism":"auto.deno.global_handlers.unhandledrejection","sdk":"sentry.javascript.deno","runtime":"deno"}

WITHOUT HOOK (deno 2.9.0, mysql2 3.23.3), evidence-nohook.txt:
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","sdk":"sentry.javascript.deno","runtime":"deno"}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/__ready","server.address":"127.0.0.1","http.response.status_code":404}}]}
{"type":"span","items":[{"span":"db mysql2.pool.connect","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"db mysql2.connect","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"db SELECT users","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/users","server.address":"127.0.0.1","http.response.status_code":200}}]}
{"type":"span","items":[{"span":"db mysql2.connect","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"db SELECT users","attrs":{"sentry.origin":"auto.db.mysql2.diagnostic_channel","sentry.op":"db","db.system.name":"mysql","db.query.text":"SELECT * FROM users","db.query.summary":"SELECT users","db.operation.name":"SELECT","db.namespace":"app","server.address":"127.0.0.1","server.port":3307}},{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/users-conn","server.address":"127.0.0.1","http.response.status_code":200}}]}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/sentinel","server.address":"127.0.0.1","http.response.status_code":200}}]}

WITH HOOK (deno 2.9.0, mysql2 3.15.0), m315/app-m315-hook-clean.log:
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const { version } = require('../package.json');
                    ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at Object.<anonymous> (file://$REPRO/probes/D15/m315/node_modules/mysql2/lib/connection_config.js:13:21)
run.sh: --- app never listened on 51820

WITHOUT HOOK (deno 2.9.0, mysql2 3.15.0), m315/evidence-m315-nohook.txt:
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","sdk":"sentry.javascript.deno","runtime":"deno"}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/__ready","server.address":"127.0.0.1","http.response.status_code":404}}]}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/users","server.address":"127.0.0.1","http.response.status_code":200}}]}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/users-conn","server.address":"127.0.0.1","http.response.status_code":200}}]}
{"type":"span","items":[{"span":"http.server GET","attrs":{"sentry.origin":"auto.http.deno","sentry.op":"http.server","url.path":"/sentinel","server.address":"127.0.0.1","http.response.status_code":200}}]}
```

Every load-bearing assertion of the record holds: the hook crashes the mysql2 import at
`lib/connection_config.js:13` for both mysql2 versions and the server never listens; without the
hook mysql2 3.23.3 produces `db mysql2.pool.connect`, `db mysql2.connect` and `db SELECT users`
spans with origin `auto.db.mysql2.diagnostic_channel`, `db.query.text: "SELECT * FROM users"`,
`db.query.summary: "SELECT users"`, `db.system.name: mysql`, `db.namespace: app` and
`server.address`/`server.port`, for the module-scope pool as well as the per-request
`createConnection`; and without the hook mysql2 3.15.0 produces no db spans at all.

Differences from the record, none of them affecting the verdict:

- Deno 2.8.3 was not re-tested: the CI-pin binary the record used (`$S/deno283/deno`) is no longer
  on this machine. Only Deno 2.9.0 was run.
- The hook runs here do land one sink item, the captured `SyntaxError` unhandled rejection
  (`mechanism: auto.deno.global_handlers.unhandledrejection`), where the record noted "no sink
  items". Same crash; the SDK simply managed to flush the error event before the process exited.
  There are still no spans and no server.
- With mysql2 3.15.0 the `[Sentry] @sentry/server-runtime-injection was bundled...` warning did not
  print; the record reports it for both mysql2 versions. It printed as recorded for 3.23.3.
- There is a fourth `http.server GET` span per no-hook run, for the `/__ready` readiness request
  this rebuild's runner uses (the record drove readiness through `/sentinel`).
- Ports are 51815-51822 instead of 41211-43414, and the SDK comes from the `_toolbox/pack` tarballs
  instead of symlinks into the worktree, so the crash path is `probes/D15/node_modules/mysql2/...`
  rather than the worktree's `node_modules`.
- The entry is split into `main-{hook,nohook}.ts` (three imports) plus shared `instrument.ts` and
  `app.ts`, instead of two self-contained `main-*.ts` files. The hook is still the first import of
  the hook entry.

## Files

- `main-hook.ts` - entry with `import "@sentry/deno/import"` first
- `main-nohook.ts` - the same entry without the hook
- `instrument.ts` - `Sentry.init` with the sink as `tunnel`
- `app.ts` - module-scope mysql2 pool, `/users`, `/users-conn`, `/sentinel` on `Deno.serve`
- `deno.json` - `nodeModulesDir: "manual"`
- `package.json` - SDK tarballs plus mysql2 3.23.3
- `sink.mjs` - envelope sink, span mapping extended to keep the full attribute bag
- `summarize.mjs` - renders `items-<label>.json` as the trimmed evidence lines
- `run.sh` - starts sink and app, drives the routes, dumps the sink, kills both
- `items-hook.json`, `items-nohook.json` - full sink dumps of the runs above
- `evidence-hook.txt`, `evidence-nohook.txt` - the trimmed lines above
- `app-hook.log`, `app-nohook.log`, `app-hook-clean.log`, `sink-*.log` - process output
- `m315/` - the same app with mysql2 3.15.0 (own `package.json`, `node_modules`, logs and evidence)
