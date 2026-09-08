# B16 — Bun native APIs: `Bun.sql`, `bun:sqlite`, `Bun.redis`

## What it reproduces

A Bun app instrumented with `@sentry/bun` (develop, 10.67.0) serves three routes that each use one
Bun builtin data API from a module-scope client: `bun:sqlite` (`new Database(":memory:")`),
`Bun.sql` (`new SQL("mysql://root@127.0.0.1:3307/app")` against the local MariaDB) and `Bun.redis`
(`new RedisClient` against a `redis:7-alpine` container). All three queries execute fine and the
`http.server` transactions arrive, but every transaction has `spans: []` — no database span is
produced for any of the three, both with plain `bun run app.ts` and with a `Bun.build` +
`sentryBunPlugin()` bundle. The SDK ships no instrumentation for these APIs: the built
`@sentry/bun` contains no reference to `sqlite`, `bun:sqlite`, `Bun.sql` or `RedisClient`, and the
bundler plugin reports `injected libraries=[]` because Bun builtins are not npm modules on its
injection list. Errors and `http.server` transactions are unaffected.

## Install

```
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
```

Prerequisites: bun 1.4.0, the MariaDB 11 container on `127.0.0.1:3307` (`root`, no password,
database `app`, table `users(id, name)` with rows `ada` and `linus`), and Docker for the Redis
container started below.

## Run

Ports used below: sink `34117`, app `34118`, Redis `51847`. Pick free ones and pass them through
`SINK_PORT`, `PORT` and `REDIS_PORT` if they are taken.

```
S=$SCRATCH
cd $REPRO/probes/B16

docker run -d --rm --name probe-B16-redis -p 127.0.0.1:51847:6379 redis:7-alpine

PORT=34117 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 & sinkpid=$!

# leg 1: plain bun run
SENTRY_DEBUG=1 REDIS_PORT=51847 bun run app.ts > app-plain.log 2>&1 & apppid=$!
sh drive.sh                       # DELETE sink, GET /sqlite /sql /redis /sentinel, wait for sentinel, print /__items
kill $apppid; wait $apppid

# leg 2: Bun.build bundle with sentryBunPlugin()
bun run build.ts > build.log 2>&1
SENTRY_DEBUG=1 REDIS_PORT=51847 bun dist/app.js > app-bundled.log 2>&1 & apppid=$!
sh drive.sh
kill $apppid; wait $apppid

kill $sinkpid; wait $sinkpid
docker stop probe-B16-redis

# the SDK has no code for these APIs at all
grep -rli sqlite node_modules/@sentry/bun/build
grep -rlE 'Bun\.sql|Bun\.redis|bun:sqlite|Bun\.SQL|RedisClient' node_modules/@sentry/bun/build
```

## Expected

Recorded verdict: **works** — the expected "no db span" behaviour is confirmed for all three Bun
native APIs on Bun 1.4.0, with plain `bun run` and with the bundler plugin.

Recorded evidence:

```
plain bun run (SENTRY_DEBUG=1), tail of app-plain-run2.log:
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. ...
PORT=53172 bun=1.4.0 hasSQL=function hasRedis=function

drive.sh output (plain):
/sqlite -> [{"id":1,"name":"a"},{"id":2,"name":"b"}]
/sql -> [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
/redis -> {"v":"v"}
/sentinel -> ok
[{"type":"transaction","name":"GET /sqlite","op":"http.server","source":"route","status":"ok","spans":[]},{"type":"transaction","name":"GET /sql","op":"http.server","source":"route","status":"ok","spans":[]},{"type":"transaction","name":"GET /redis","op":"http.server","source":"route","status":"ok","spans":[]},{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":{"name":"bun","version":"1.4.0"},"hasContextLine":true},{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","spans":[]}]

bundled (bun run build.ts; bun dist/app.js), tail of app-bundled-run2.log:
Sentry Logger [log]: [Sentry] Runtime hook not registered
Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
PORT=53172 bun=1.4.0 hasSQL=function hasRedis=function

drive.sh output (bundled) is byte-identical apart from span ids: all four transactions have "spans":[] and the sentinel event arrived.

grep of built packages: `grep -rli sqlite $W/packages/bun/build` -> (no output); `grep -rl 'Bun\.sql\|Bun\.redis\|bun:sqlite\|Bun\.SQL\|RedisClient' $W/packages/bun/build` -> (no output); only hits repo-wide: packages/server-utils/build/esm/integrations/knex.js:13 `const DB_SYSTEM_SQLITE = "sqlite";` and :132 `if (driverName === "sqlite3")` (knex dialect mapping), plus packages/core/build/utils/sql.js.map.
```

## Observed on 2026-09-07

Bun 1.4.0, `@sentry/bun` 10.67.0 installed from the develop tarballs.

Plain `bun run app.ts`, tail of `app-plain.log`:

```
Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.
PORT=34118 bun=1.4.0 hasSQL=function hasRedis=function
```

`sh drive.sh` (plain), `drive-plain.out`:

```
/sqlite -> [{"id":1,"name":"a"},{"id":2,"name":"b"}]
/sql -> [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
/redis -> {"v":"v"}
/sentinel -> ok
[{"type":"transaction","name":"GET /sqlite","op":"http.server","source":"route","status":"ok","trace_id":"c85d96eb5d2d402fa0f5199d66cca122","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false},{"type":"transaction","name":"GET /sql","op":"http.server","source":"route","status":"ok","trace_id":"d399b19181344dae90df3e4bf6d78a76","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false},{"type":"transaction","name":"GET /redis","op":"http.server","source":"route","status":"ok","trace_id":"181886b89d7949d590a81d4d087bb24d","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false},{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"trace_id":"846609f33f9b45c9ae36d8aa0a673813","request":{"url":"http://127.0.0.1:34118/sentinel","method":"GET","hasData":false,"headers":{"host":"127.0.0.1:34118","user-agent":"curl/8.7.1","accept":"*/*"}},"environment":"production"},{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","trace_id":"846609f33f9b45c9ae36d8aa0a673813","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false}]
```

Bundled (`bun run build.ts`; `bun dist/app.js`), tail of `app-bundled.log`:

```
Sentry Logger [log]: [Sentry] Runtime hook not registered
Sentry Logger [log]: [Sentry] Bundler plugin ran, injected libraries=[]
PORT=34118 bun=1.4.0 hasSQL=function hasRedis=function
```

`sh drive.sh` (bundled), `drive-bundled.out`:

```
/sqlite -> [{"id":1,"name":"a"},{"id":2,"name":"b"}]
/sql -> [{"id":1,"name":"ada"},{"id":2,"name":"linus"}]
/redis -> {"v":"v"}
/sentinel -> ok
[{"type":"transaction","name":"GET /sqlite","op":"http.server","source":"route","status":"ok","trace_id":"591acc118c084cbca27bf18efcf47abc","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false},{"type":"transaction","name":"GET /sql","op":"http.server","source":"route","status":"ok","trace_id":"c2bedcf2ce2a4eed9f1edc25d8170b0e","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false},{"type":"transaction","name":"GET /redis","op":"http.server","source":"route","status":"ok","trace_id":"1bd63256306348e09e476fa1b03c4251","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false},{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"trace_id":"89b0ad0d3e7947c981467fd40a803605","request":{"url":"http://127.0.0.1:34118/sentinel","method":"GET","hasData":false,"headers":{"host":"127.0.0.1:34118","user-agent":"curl/8.7.1","accept":"*/*"}},"environment":"production"},{"type":"transaction","name":"GET /sentinel","op":"http.server","source":"route","status":"ok","trace_id":"89b0ad0d3e7947c981467fd40a803605","sdk":"sentry.javascript.bun","spans":[],"hasRequestData":false}]
```

Grep of the installed 10.67.0 build (`grep.out`):

```
# grep -rli sqlite node_modules/@sentry/bun/build
(exit 1)

# grep -rl 'Bun\.sql|Bun\.redis|bun:sqlite|RedisClient' node_modules/@sentry/bun/build
(exit 1)

# repo-wide sqlite hits in installed @sentry packages
node_modules/@sentry/core/build/types/utils/sql.d.ts
node_modules/@sentry/core/build/esm/utils/sql.js.map
node_modules/@sentry/core/build/cjs/utils/sql.js.map
node_modules/@sentry/server-utils/build/esm/integrations/knex.js
node_modules/@sentry/server-utils/build/esm/integrations/knex.js.map
node_modules/@sentry/server-utils/build/cjs/integrations/knex.js
node_modules/@sentry/server-utils/build/cjs/integrations/knex.js.map
```

**Matches the recorded verdict.** All four transactions carry `spans: []` in both legs, the three
Bun native APIs return their data, the sentinel event arrives, the plain run warns about the missing
diagnostics-channel injection and the bundled run reports `injected libraries=[]`.

Differences are cosmetic only: this run used ports 34117/34118/51847 instead of 53171/53172/53177,
the SDK was installed from the develop tarballs rather than symlinked into the worktree (so the grep
ran against `node_modules/@sentry/*/build` instead of `$W/packages/*/build`, with the same result),
and the stock `$REPRO/_toolbox/sink.mjs` renders the sentinel event as `"exception":"undefined: sentinel"` and
`"runtime":"bun"` where the recorded run used a locally extended sink that printed `"sentinel"` and
`{"name":"bun","version":"1.4.0"}`.
