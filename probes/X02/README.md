# Probe X02: K11 independent re-verification (lazy module load under Bun)

Runtime: Bun (system Bun, 1.4.2 on this run; the record ran 1.4.0) and the CI pin Bun 1.3.14.
SDK: `develop` (v11 line, package version 10.67.0) installed from the tarballs in `_toolbox/pack`.

## What it reproduces

With a `sentryBunPlugin()` bundle, a `mysql` connection created at module scope produces the
`db SELECT id, name FROM users` span, while a connection created inside the request handler produces
no db span at all, on both Bun versions (the two behave identically, so the earlier claim that 1.3.14
differs does not hold). A static top-level `import mysql` is already enough to hit this, because
`mysql@2`'s `index.js` lazily requires `lib/Connection.js` on the first `createConnection`, so the
instrumented file first evaluates inside the request; `await import('mysql')` in the handler behaves
the same. The cause is not the SDK's span logic: with no SDK at all, a plain
`dc.tracingChannel('orchestrion:mysql:query').subscribe(...)` at module scope fires zero events when
`mysql` loads in the handler, and one start/end/asyncStart/asyncEnd set per query when `mysql` loads at
module scope. `dc-gc.mjs` isolates it further, with no SDK, no bundle and no mysql: Bun drops a channel
and its subscribers on GC when no user code holds a strong reference to the Channel/TracingChannel
object (a plain `dc.subscribe(name, fn)` is lost too), whereas Node keeps subscribed channels alive.
The SDK calls `bindTracingChannelToSpan(diagnosticsChannel.tracingChannel(...))` and discards the
returned `channel` handle (`packages/server-utils/src/tracing-channel.ts:200-208`,
`packages/server-utils/src/integrations/mysql.ts:79-80`), so once GC has run, the lazily evaluated
`Connection.js` gets a fresh, unsubscribed channel. Holding the channel from user code
(`globalThis.__keepMysqlChannel = dc.tracingChannel('orchestrion:mysql:query')`, the `lazy-keep`
variant) restores the db span on both Bun versions, which confirms the mechanism and is a user-side
workaround; the SDK-side fix is to retain the channel objects it subscribes to.

## Install

```
npm install --no-audit --no-fund
```

`package.json` already points every `@sentry/*` dependency at the tarballs in `_toolbox/pack`, so the
bare install is enough. The explicit form is:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-bun-10.67.0.tgz \
  ../../_toolbox/pack/sentry-node-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz \
  mysql@2
```

`dist-140/` and `dist-1314/` are checked in, so after the install the apps run without a rebuild.
The bundles keep `@sentry/*` external, so `node_modules` is required even to run the prebuilt output.

## Run

MariaDB must be reachable on `127.0.0.1:3307` (root, no password, db `app`, table `users`).
Bun 1.3.14 is not on this machine by default; `npm install bun@1.3.14` in a scratch directory
provides it as `node_modules/.bin/bun`.

```
X=$REPRO/probes/X02
B1314=<scratch>/node_modules/.bin/bun     # from `npm install bun@1.3.14`
cd $X

# envelope sink (port 45231, the default in run.sh / run2.sh)
PORT=45231 node sink.mjs > sink.log 2>&1 &

# rebuild only if dist-140 / dist-1314 are missing
OUTDIR=./dist-140  bun run build.ts;     OUTDIR=./dist-140  bun run build2.ts
OUTDIR=./dist-1314 $B1314 run build.ts;  OUTDIR=./dist-1314 $B1314 run build2.ts

# the five variants (modscope, inreq, lazy, nosdk-lazy, nosdk-modscope), then the workaround
./run.sh bun ./dist-140 bun140
./run2.sh bun ./dist-140 bun140
APP_PORT=45261 ./run.sh  $B1314 ./dist-1314 bun1314
APP_PORT=45271 ./run2.sh $B1314 ./dist-1314 bun1314

# root cause, no SDK, no bundle, no mysql
bun dc-gc.mjs; $B1314 dc-gc.mjs; node --expose-gc dc-gc.mjs
```

`run.sh` starts each bundled app on ports 45241+, drives it from a plain `node drive.mjs` (a fetch
from a Sentry-initialised process would mark the server transaction as not sampled), waits for the
`sentinel` event in the sink, and writes `log-<tag>-<variant>.txt`. Kill the sink with the pid you
captured when starting it.

## Expected

Recorded verdict: **broken**. Recorded evidence lines:

```
bun 1.4.0, SDK, module-scope connection (log-bun140-modscope.txt):
GET /db -> {"variant":"modscope",...,"startSubscribed":true}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":["db SELECT id, name FROM users"]},{"type":"event","message":"sentinel",...,"runtime":{"name":"bun","version":"1.4.0"}},...]

bun 1.4.0, SDK, createConnection inside request (log-bun140-inreq.txt):
GET /db -> {"variant":"inreq",...,"startSubscribed":false}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]},{"type":"event","message":"sentinel",...},...]

bun 1.4.0, SDK, await import('mysql') in handler (log-bun140-lazy.txt):
GET /db -> {"variant":"lazy",...,"loadedBefore":[],"loadedAfter":[],"startSubscribed":false}
SINK: [{"type":"transaction","name":"GET /db",...,"spans":[]},{"type":"transaction","name":"GET /sentinel",...},{"type":"event","message":"sentinel",...}]

bun 1.3.14, SDK (log-bun1314-modscope.txt / -inreq.txt / -lazy.txt):
modscope: "spans":["db SELECT id, name FROM users"] ... "runtime":{"name":"bun","version":"1.3.14"}
inreq:    GET /db -> {"variant":"inreq",...,"startSubscribed":false}  SINK: ..."name":"GET /db",...,"spans":[]...
lazy:     GET /db -> {"variant":"lazy",...,"startSubscribed":false}  SINK: ..."name":"GET /db",...,"spans":[]...

no-SDK channel subscriber, mysql loaded in handler (log-bun140-nosdk-lazy.txt, identical on 1.3.14):
GET /db -> {"variant":"nosdk-lazy","rows":[...],"counts":{"start":0,"end":0,"asyncStart":0,"asyncEnd":0,"error":0},"startSubscribed":false,"rawStartSubscribed":false,"loaded":["mysql"]}
-- second request
GET /db -> {..."counts":{"start":0,"end":0,"asyncStart":0,"asyncEnd":0,"error":0},"startSubscribed":false,"rawStartSubscribed":false,"loaded":["mysql"]}

no-SDK channel subscriber, mysql loaded at module scope (log-bun140-nosdk-modscope.txt, identical on 1.3.14):
GET /db -> {"variant":"nosdk-modscope",...,"counts":{"start":1,"end":1,"asyncStart":1,"asyncEnd":1,"error":0},"startSubscribed":true,"rawStartSubscribed":true,"loaded":["mysql"]}
-- second request
..."counts":{"start":2,"end":2,"asyncStart":2,"asyncEnd":2,"error":0}...

Root-cause script dc-gc.mjs (no SDK, no bundle, no mysql):
### bun 1.4.0
B timer after gc: held(lookup)= true held(ref)= true dropped(lookup)= false plaindropped(lookup)= false
C fired (expect 1 each): {"held":1,"dropped":0,"plainDropped":0}
### bun 1.3.14
B timer after gc: held(lookup)= true held(ref)= true dropped(lookup)= false plaindropped(lookup)= false
C fired (expect 1 each): {"held":1,"dropped":0,"plainDropped":0}
### node v26.5.0
B timer after gc: held(lookup)= true held(ref)= true dropped(lookup)= true plaindropped(lookup)= true
C fired (expect 1 each): {"held":1,"dropped":1,"plainDropped":1}

Workaround confirmation, SDK + lazy import + user-held strong channel ref (log-bun140-lazy-keep.txt; same on 1.3.14):
GET /db -> {"variant":"lazy-keep",...,"loadedBefore":[],"loadedAfter":[]
```

## Observed on 2026-09-07

Matches the recorded verdict, on both Bun versions. Verbatim, trimmed (the SINK lines keep only the
transaction and event items and drop `trace_id`, `client_report`, request headers and `environment`;
the full lines are in `log-*.txt`, the trimmed set in `observed-trimmed.txt`):

```
=== bun140 modscope
GET /db -> {"variant":"modscope","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"startSubscribed":true}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":["db SELECT id, name FROM users"]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun140 inreq
GET /db -> {"variant":"inreq","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"startSubscribed":false}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":[]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun140 lazy
GET /db -> {"variant":"lazy","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"loadedBefore":[],"loadedAfter":[],"startSubscribed":false}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":[]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun140 nosdk-lazy
GET /db -> {"variant":"nosdk-lazy","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":0,"end":0,"asyncStart":0,"asyncEnd":0,"error":0},"startSubscribed":false,"rawStartSubscribed":false,"loaded":["mysql"]}
-- second request
GET /db -> {"variant":"nosdk-lazy","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":0,"end":0,"asyncStart":0,"asyncEnd":0,"error":0},"startSubscribed":false,"rawStartSubscribed":false,"loaded":["mysql"]}

=== bun140 nosdk-modscope
GET /db -> {"variant":"nosdk-modscope","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":1,"end":1,"asyncStart":1,"asyncEnd":1,"error":0},"startSubscribed":true,"rawStartSubscribed":true,"loaded":["mysql"]}
-- second request
GET /db -> {"variant":"nosdk-modscope","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":2,"end":2,"asyncStart":2,"asyncEnd":2,"error":0},"startSubscribed":true,"rawStartSubscribed":true,"loaded":["mysql"]}

=== bun140 lazy-keep
GET /db -> {"variant":"lazy-keep","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"loadedBefore":[],"loadedAfter":[],"startSubscribed":true}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":["db SELECT id, name FROM users"]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun1314 modscope
GET /db -> {"variant":"modscope","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"startSubscribed":true}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":["db SELECT id, name FROM users"]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun1314 inreq
GET /db -> {"variant":"inreq","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"startSubscribed":false}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":[]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun1314 lazy
GET /db -> {"variant":"lazy","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"loadedBefore":[],"loadedAfter":[],"startSubscribed":false}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":[]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]

=== bun1314 nosdk-lazy
GET /db -> {"variant":"nosdk-lazy","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":0,"end":0,"asyncStart":0,"asyncEnd":0,"error":0},"startSubscribed":false,"rawStartSubscribed":false,"loaded":["mysql"]}
-- second request
GET /db -> {"variant":"nosdk-lazy","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":0,"end":0,"asyncStart":0,"asyncEnd":0,"error":0},"startSubscribed":false,"rawStartSubscribed":false,"loaded":["mysql"]}

=== bun1314 nosdk-modscope
GET /db -> {"variant":"nosdk-modscope","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":1,"end":1,"asyncStart":1,"asyncEnd":1,"error":0},"startSubscribed":true,"rawStartSubscribed":true,"loaded":["mysql"]}
-- second request
GET /db -> {"variant":"nosdk-modscope","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"counts":{"start":2,"end":2,"asyncStart":2,"asyncEnd":2,"error":0},"startSubscribed":true,"rawStartSubscribed":true,"loaded":["mysql"]}

=== bun1314 lazy-keep
GET /db -> {"variant":"lazy-keep","rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"loadedBefore":[],"loadedAfter":[],"startSubscribed":true}
SINK: [{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":["db SELECT id, name FROM users"]},{"type":"event","message":"sentinel","sdk":"sentry.javascript.bun","runtime":"bun"}]


### bun 1.4.2
B timer after gc: held(lookup)= true held(ref)= true dropped(lookup)= false plaindropped(lookup)= false
C fired (expect 1 each): {"held":1,"dropped":0,"plainDropped":0}
### bun 1.3.14
B timer after gc: held(lookup)= true held(ref)= true dropped(lookup)= false plaindropped(lookup)= false
C fired (expect 1 each): {"held":1,"dropped":0,"plainDropped":0}
### node v26.5.0
B timer after gc: held(lookup)= true held(ref)= true dropped(lookup)= true plaindropped(lookup)= true
C fired (expect 1 each): {"held":1,"dropped":1,"plainDropped":1}
```

Differences from the record, none of which change the verdict:

- The original probe files were lost, so the apps were rewritten from the record's description. Two
  details had to be re-derived: a `tracingChannel(name)` publishes on `tracing:<name>:start`, so
  `startSubscribed` looks up `tracing:orchestrion:mysql:query:start`, and the no-SDK subscriber must
  not keep a variable pointing at the channel, otherwise it survives GC and the lazy case fires
  events. `loadedBefore` / `loadedAfter` are the `mysql` entries of the CommonJS require cache, which
  is empty in a Bun bundle in both cases, as in the record.
- The system Bun is 1.4.2 here, not the record's 1.4.0; the `bun140` tag in the file names is kept
  for continuity with the record. Results are identical.
- The record's `$S/bun1314/bun-darwin-aarch64/bun` no longer exists; Bun 1.3.14 came from
  `npm install bun@1.3.14` into a scratch directory instead. Same version, same results.
- The sink here reports `"runtime":"bun"` rather than the record's
  `"runtime":{"name":"bun","version":"1.4.0"}`, and adds a `client_report` item; that is the sink's
  compact mapping, not app behavior.
- The record's `lazy` SINK also carried a `GET /sentinel` transaction; whether that transaction lands
  before or after the driver stops polling for the sentinel event is a flush-ordering race and does
  not affect the `GET /db` span list, which is the finding.
