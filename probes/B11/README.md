# Probe B11: single-file executable (`bun build --compile`) with the Sentry plugin

Runtime: bun 1.4.0. SDK: `develop` (v11 line, package version 10.67.0) installed from the
tarballs in `_toolbox/pack`.

## What it reproduces

`Bun.build({ compile: { outfile }, plugins: [sentryBunPlugin()] })` accepts the Sentry Bun plugin and
produces a standalone ~67 MB executable in which diagnostics-channel injection is live: run from an
empty cwd with no `node_modules` anywhere, the binary captures both the `Bun.serve` error
(`auto.http.bun.serve`) and the Express error, emits `Bun.serve` `http.server` spans with route names,
full Express middleware/handler spans with the parameterized `http.server GET /users/:id` name, and
`db SELECT users` spans for a module-scope `mysql` connection. The `external: ['@sentry/*']` pattern
taken from the non-compile `build.ts` quick start is fatal here: the binary dies at boot with
`Cannot find module '@sentry/bun' from '/$bunfs/root/app-plugin-ext'` in every cwd, because Bun
resolves externals from the virtual `/$bunfs/root/` and never falls back to a real `node_modules`.
The baseline `bun build --compile app.ts` (no plugin) boots and records the `Bun.serve` error and
spans but has no Express spans, names Express requests `http.server GET` (method only), and logs the
"No diagnostics-channel injection detected" warning. The CLI has no `--plugin` flag for `--compile`,
so the JS API is the only plugin path.

## Install

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-bun-10.67.0.tgz \
  ../../_toolbox/pack/sentry-node-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz \
  express@4 mysql@2
```

The four compiled binaries are 62-67 MB each, so the build scripts write them to
`node_modules/.b11-bin/`; `rm -rf node_modules` removes them together with the deps, and the build
commands below recreate them.

## Run

MariaDB must be reachable on `127.0.0.1:3307` (root, no password, db `app`, table `users`) for the
`app-db-plugin` variant only.

```
S=$SCRATCH
B=$REPRO/probes/B11
EMPTY=$REPRO/probes/B11/cwd-empty   # any directory with no node_modules above it
mkdir -p "$EMPTY"

# envelope sink
PORT=47512 node $REPRO/_toolbox/sink.mjs > $REPRO/probes/B11/sink-47512.log 2>&1 &

# build the four executables
cd $B
bun run build.ts        # compile + plugin              -> node_modules/.b11-bin/app-plugin
bun run build-ext.ts    # compile + plugin + external   -> node_modules/.b11-bin/app-plugin-ext
bun run build-db.ts     # compile + plugin, mysql app   -> node_modules/.b11-bin/app-db-plugin
bun build --compile app.ts --outfile node_modules/.b11-bin/app-baseline

# run each binary from the empty cwd and drive it from a plain node process
./run-b11.sh "$B/node_modules/.b11-bin/app-plugin"     plugin              "$EMPTY" 47541 47542 47512
./run-b11.sh "$B/node_modules/.b11-bin/app-baseline"   baseline            "$EMPTY" 47543 47544 47512
./run-b11.sh "$B/node_modules/.b11-bin/app-plugin-ext" plugin-ext-emptycwd "$EMPTY" 47551 47552 47512
./run-b11.sh "$B/node_modules/.b11-bin/app-plugin-ext" plugin-ext-projcwd  "$B"     47553 47554 47512

# the mysql variant
cd "$EMPTY" && curl -s -X DELETE http://127.0.0.1:47512/__items > /dev/null
SINK=http://127.0.0.1:47512/ PORT=47561 SENTRY_DEBUG=1 $B/node_modules/.b11-bin/app-db-plugin > $B/logs/db.app.log 2>&1 &
node $B/drive-db.mjs 47561 47512 > $B/logs/db.drive.log 2>&1

# no --plugin flag for the CLI
bun build --help | grep -i plugin   # no output
```

`run-b11.sh` writes `logs/<label>.app.log` (the binary's stdout, `SENTRY_DEBUG=1`) and
`logs/<label>.drive.log` (the driver output plus the sink dump). The drivers wait for a
`captureMessage('sentinel')` event **and** the `GET /sentinel` span before reading the sink, so
nothing is timing-dependent.

## Expected

Recorded verdict: **works**.

Recorded evidence lines:

```
app-plugin (compile + plugin, cwd=cwd-empty):
/injected 200 {"bundler":["express"],"runtime":null,"standalone":true,"execPath":".../deep/B11/develop/bin/app-plugin"}
"exception": "route boom", "mechanism": "auto.http.bun.serve"
"exception": "express boom", "mechanism": "auto.http.express"
"message": "sentinel"
{"type":"span","items":["http.server GET /hello/:name"]}
{"type":"span","items":["middleware expressInit","middleware query2","handler /users/:id","http.server GET /users/:id","http.client GET 127.0.0.1","http.server GET /downstream"]}
{"type":"span","items":["http.server GET /error"]}
{"type":"span","items":["handler /boom","middleware expressInit","middleware query2","http.server GET /boom"]}
app log: Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.

app-db-plugin (compile + plugin, mysql module-scope connection):
/injected 200 {"bundler":["mysql"],"standalone":true}
["db SELECT users","http.server GET /db"] (x2)

app-plugin-ext (compile + plugin + external: ['@sentry/*'], both empty cwd and project cwd):
error: Cannot find module '@sentry/bun' from '/$bunfs/root/app-plugin-ext'
Bun v1.4.0 (macOS arm64)

app-baseline (`bun build --compile app.ts`, no plugin):
/injected 200 {"bundler":null,"runtime":null,"standalone":true,...}
"exception": "route boom", "mechanism": "auto.http.bun.serve"   (no "express boom" event)
{"type":"span","items":["http.server GET","http.client GET 127.0.0.1","http.server GET /downstream"]}
{"type":"span","items":["http.server GET"]}  (express requests, method-only name, no express spans)
app log: Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.

bun build --help | grep -i plugin -> (no output; no --plugin flag)
```

## Observed on 2026-09-07

Matches the recorded verdict (**works**), with one deviation noted at the end.

`app-plugin` (compile + plugin, cwd = empty dir), `logs/plugin.drive.log`:

```
http://127.0.0.1:47541/injected 200 {"bundler":["express"],"runtime":null,"standalone":true,"execPath":"$REPRO/probes/B11/node_modules/.b11-bin/app-plugin","cwd":".../scratchpad/deep/B11/cwd-empty"}
{"type":"event","exception":"Error: route boom","mechanism":"auto.http.bun.serve","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun"}
{"type":"event","exception":"Error: express boom","mechanism":"auto.http.express","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","transaction":"GET /boom"}
{"type":"event","message":"sentinel",...,"mechanism":"generic","handled":true}
{"type":"span","items":["http.server GET /hello/:name"]}
{"type":"span","items":["http.server GET /error"]}
{"type":"span","items":["middleware query2","middleware expressInit","middleware query2","http.server GET /downstream","http.client GET 127.0.0.1","handler /users/:id","http.server GET /users/:id"]}
{"type":"span","items":["handler /boom","middleware query2","middleware expressInit","middleware query2","http.server GET /boom"]}
{"type":"span","items":["http.server GET /sentinel"]}
```

`logs/plugin.app.log`:

```
1:Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
101:Sentry Logger [log]: [Sentry] Runtime hook not registered
102:Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
```

`app-db-plugin` (compile + plugin, module-scope mysql connection), `logs/db.drive.log`:

```
http://127.0.0.1:47561/injected 200 {"bundler":["mysql"],"runtime":null,"standalone":true}
http://127.0.0.1:47561/db 200 [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
{"type":"span","items":["db SELECT users","http.server GET /db"]}
{"type":"span","items":["db SELECT users","http.server GET /db"]}
```

`app-plugin-ext` (compile + plugin + `external: ['@sentry/*']`), identical from the empty cwd
(`logs/plugin-ext-emptycwd.app.log`) and from the project dir that has `node_modules`
(`logs/plugin-ext-projcwd.app.log`):

```
error: Cannot find module '@sentry/bun' from '/$bunfs/root/app-plugin-ext'

Bun v1.4.0 (macOS arm64)
```

`app-baseline` (`bun build --compile app.ts`, no plugin), `logs/baseline.drive.log` and
`logs/baseline.app.log`:

```
http://127.0.0.1:47543/injected 200 {"bundler":null,"runtime":null,"standalone":true,...}
{"type":"event","exception":"Error: route boom","mechanism":"auto.http.bun.serve"}
{"type":"event","exception":"Error: express boom","mechanism":"auto.middleware.express","transaction":"GET /boom"}
{"type":"span","items":["http.server GET /hello/:name"]}
{"type":"span","items":["http.server GET /error"]}
{"type":"span","items":["http.server GET /downstream","http.client GET 127.0.0.1","http.server GET"]}
{"type":"span","items":["http.server GET"]}
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
```

`bun build --help | grep -i plugin` still prints nothing, and binary sizes match the record
(app-plugin 67M, app-db-plugin 66M, app-baseline 63M, app-plugin-ext 62M).

**Deviation:** the record says the baseline binary captured no `express boom` event. This rebuild's
`app.ts` registers `Sentry.expressErrorHandler()` explicitly, and that plain middleware still works
without injection, so the baseline does report the Express error, with mechanism
`auto.middleware.express` instead of the injected build's `auto.http.express`. The distinguishing
baseline signal is therefore the mechanism and the missing Express spans / method-only
`http.server GET` name, not the absence of the event. Everything else, including the
`external: ['@sentry/*']` boot failure and the mysql spans, reproduced verbatim.
