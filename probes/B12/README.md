# B12 — `bun --watch` and `bun --hot` dev modes

Runtime: bun 1.4.0 · SDK: `@sentry/bun` 10.67.0 (develop, `getsentry/sentry-javascript@6f2da7483d`)

## What it reproduces

A minimal `Bun.serve` app with `import "./instrument";` as the first line of the entry, run under Bun's
two dev modes. Under `bun --watch` everything behaves: the route error, the captured sentinel and one
`http.server` span per request arrive, and an edit restarts the process with fresh module state so the
next generation behaves identically. Under `bun --hot` the same app breaks after the first reload,
because Bun re-evaluates the whole module graph including `@sentry/bun`: `Sentry.init` runs again with
no warning, the module-level `hasPatchedBunServe` guard in `packages/bun/src/integrations/bunserver.ts`
resets so `Bun.serve` is wrapped in a second Proxy on top of the first, and the
`uncaughtException`/`unhandledRejection` listeners accumulate. After N-1 reloads every request emits N
`http.server` root spans, each in its own trace; the error event survives as a single event only
because the second wrapper hits the `__sentry_captured__` dedupe flag. Moving init out of the module
graph with `bun --hot --preload ./instrument.ts` avoids all of it.

## Install

```
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
```

## Run

Sink on 51811, app on 51812. `drive.mjs <tag>` clears the sink, hits `/hello/world`, `/error` and
`/sentinel/<tag>`, waits until both the sentinel event and the sentinel `http.server` span have
arrived, then prints the sink contents.

```
cd $REPRO/probes/B12
PORT=51811 node ./sink.mjs > sink.log 2>&1 & sinkpid=$!

# --watch
bun --watch app.ts > watch.log 2>&1 & wpid=$!
node drive.mjs sentinel-w1 > drive-watch-1.log 2>&1
sed -i '' 's/^const GEN = 1;/const GEN = 2;/' app.ts     # wait for GEN=2 in watch.log
node drive.mjs sentinel-w2 > drive-watch-2.log 2>&1
kill $wpid

# --hot, in-file `import "./instrument"`
sed -i '' 's/^const GEN = [0-9]*;/const GEN = 1;/' app.ts
bun --hot app.ts > hot.log 2>&1 & hpid=$!
node drive.mjs sentinel-h1 > drive-hot-1.log 2>&1
sed -i '' 's/^const GEN = 1;/const GEN = 2;/' app.ts     # wait for GEN=2 in hot.log
node drive.mjs sentinel-h2 > drive-hot-2.log 2>&1
sed -i '' 's/^const GEN = 2;/const GEN = 3;/' app.ts     # wait for GEN=3 in hot.log
node drive.mjs sentinel-h3 > drive-hot-3.log 2>&1
kill $hpid

# --hot with SENTRY_DEBUG=1 (same one-edit cycle)
SENTRY_DEBUG=1 bun --hot app.ts > hot-debug.log 2>&1 & dpid=$!

# --hot with the --preload workaround (same one-edit cycle, edits app-preload.ts)
bun --hot --preload ./instrument.ts app-preload.ts > hot-preload.log 2>&1 & ppid=$!

kill $sinkpid
```

## Expected

Recorded verdict: **partial**.

`bun --watch app.ts` works fully. `bun --hot app.ts` with the in-file import works before the first
edit, then duplicates `http.server` spans once per reload. `bun --hot --preload ./instrument.ts`
avoids it.

Recorded evidence lines:

```
--watch, gen1 then after edit gen2 (drive-watch-1.log / drive-watch-2.log):
  event exception="route boom gen1" mechanism=auto.http.bun.serve handled=false
  event exception="sentinel-w1" mechanism=generic handled=true
  span ["http.server GET /hello/:name"]
  span ["http.server GET /error"]
  span ["http.server GET /sentinel/:tag"]
  event exception="route boom gen2" mechanism=auto.http.bun.serve handled=false
  event exception="sentinel-w2" mechanism=generic handled=true
  span ["http.server GET /hello/:name"]
  span ["http.server GET /error"]
  span ["http.server GET /sentinel/:tag"]
watch.log: [instrument] evaluated#1 pid=7198 clientBeforeInit=false clientAfterInit=true sameClientAsBefore=false
           [app] PORT=47312 GEN=2 pid=7198 appEvals=1 sameBunServe=true sameSentryNs=true uncaughtListeners=1 rejectionListeners=1

--hot, after 1 edit (drive-hot-2.log):
  event exception="route boom gen2" mechanism=auto.http.bun.serve handled=false
  event exception="sentinel-h2" mechanism=generic handled=true
  span ["http.server GET /hello/:name"]
  span ["http.server GET /hello/:name"]
  span ["http.server GET /error"]
  span ["http.server GET /error"]
  span ["http.server GET /sentinel/:tag"]
  span ["http.server GET /sentinel/:tag"]
--hot, after 2 edits (drive-hot-3.log): 3x each span, error event once
hot.log:
  [instrument] evaluated#1 pid=9084 clientBeforeInit=false clientAfterInit=true sameClientAsBefore=false
  [app] PORT=47312 GEN=1 pid=9084 appEvals=1 sameBunServe=true sameSentryNs=true uncaughtListeners=1 rejectionListeners=1
  [instrument] evaluated#2 pid=9084 clientBeforeInit=true clientAfterInit=true sameClientAsBefore=false
  [app] PORT=47312 GEN=2 pid=9084 appEvals=2 sameBunServe=false sameSentryNs=false uncaughtListeners=2 rejectionListeners=2
  [instrument] evaluated#3 pid=9084 clientBeforeInit=true clientAfterInit=true sameClientAsBefore=false
  [app] PORT=47312 GEN=3 pid=9084 appEvals=3 sameBunServe=false sameSentryNs=false uncaughtListeners=3 rejectionListeners=3
hot-debug.log: 6x "Starting sampled root span", 6x "Sending span envelope for trace <6 distinct trace ids> with 1 spans",
  "Captured error event `route boom gen2`" then "Not capturing exception because it's already been captured.",
  second "Initializing Sentry: process: ..., thread: main." with no warning about a prior init.

--hot with --preload (drive-hot-preload-2.log, after 1 edit):
  event exception="route boom gen2" mechanism=auto.http.bun.serve handled=false
  event exception="sentinel-p2" mechanism=generic handled=true
  span ["http.server GET /hello/:name"]
  span ["http.server GET /error"]
  span ["http.server GET /sentinel/:tag"]
hot-preload.log: [app] PORT=47312 GEN=2 pid=14394 appEvals=2 sameBunServe=true sameSentryNs=false uncaughtListeners=1 rejectionListeners=1
```

## Observed on 2026-09-07

Matches the record. bun 1.4.0, ports 51811/51812.

`--watch` (drive-watch-1.log, drive-watch-2.log):

```
event exception="route boom gen1" mechanism=auto.http.bun.serve handled=false
event exception="sentinel-w1" mechanism=generic handled=true
span ["http.server GET /hello/:name"] trace=8c9557f9ffd548df9264b595d013636d
span ["http.server GET /error"] trace=db8db46eb1c94ddf9eadcbc36649df71
span ["http.server GET /sentinel/:tag"] trace=e9f8ea5702c5459f8973532c53b16025
event exception="route boom gen2" mechanism=auto.http.bun.serve handled=false
event exception="sentinel-w2" mechanism=generic handled=true
span ["http.server GET /hello/:name"] trace=3407015cdd8c4046bbf428c262fa4bec
span ["http.server GET /error"] trace=61a4d9fe761d498eae76baae553c578b
span ["http.server GET /sentinel/:tag"] trace=5303382da3e24477b705c58bf86a26f9
```

watch.log:

```
[instrument] evaluated#1 pid=56239 clientBeforeInit=false clientAfterInit=true sameClientAsBefore=false
[app] PORT=51812 GEN=1 pid=56239 appEvals=1 sameBunServe=true sameSentryNs=true uncaughtListeners=1 rejectionListeners=1
[instrument] evaluated#1 pid=56239 clientBeforeInit=false clientAfterInit=true sameClientAsBefore=false
[app] PORT=51812 GEN=2 pid=56239 appEvals=1 sameBunServe=true sameSentryNs=true uncaughtListeners=1 rejectionListeners=1
```

`--hot` after 1 edit (drive-hot-2.log) — 2 root spans per request, each its own trace, error event once:

```
event exception="route boom gen2" mechanism=auto.http.bun.serve handled=false
event exception="sentinel-h2" mechanism=generic handled=true
span ["http.server GET /hello/:name"] trace=3f4579b32ea74eb78c443901b97fe1c1
span ["http.server GET /hello/:name"] trace=e838f6bc2b904759839cc515f5f5893b
span ["http.server GET /error"] trace=d048ccb9739f4898a954d3c0fb988909
span ["http.server GET /sentinel/:tag"] trace=7fd28573a6d9416c88bc7f8b5bc76bae
span ["http.server GET /error"] trace=ebec48a95683451086f7759f0ef9a4c2
span ["http.server GET /sentinel/:tag"] trace=d4ede7922cc7477da12cec695f02f943
```

`--hot` after 2 edits (drive-hot-3.log) — 3 root spans per request:

```
event exception="route boom gen3" mechanism=auto.http.bun.serve handled=false
event exception="sentinel-h3" mechanism=generic handled=true
span ["http.server GET /hello/:name"] trace=013fa9e574334fb59d6bfc07035b4c30
span ["http.server GET /hello/:name"] trace=5beec420df3d4ed6ab8db3a2e1c9fc95
span ["http.server GET /hello/:name"] trace=f946b996ca694e50ba694190cdd78742
span ["http.server GET /error"] trace=bc800140f640478f9e9773cd3fc113f9
span ["http.server GET /error"] trace=f26df2ac963346cd9421aeeead1a2cb9
span ["http.server GET /error"] trace=9d7c95a9c1e64ff0863f1a97bcf1b1a3
span ["http.server GET /sentinel/:tag"] trace=4cfc9226c6c5454d84616157ed1ea725
span ["http.server GET /sentinel/:tag"] trace=ec43e22cc0ea46ffbe3622f1d27a6be8
span ["http.server GET /sentinel/:tag"] trace=f4101d8335584a1ca4ac5141b3f41e28
```

hot.log:

```
[instrument] evaluated#1 pid=56852 clientBeforeInit=false clientAfterInit=true sameClientAsBefore=false
[app] PORT=51812 GEN=1 pid=56852 appEvals=1 sameBunServe=true sameSentryNs=true uncaughtListeners=1 rejectionListeners=1
[instrument] evaluated#2 pid=56852 clientBeforeInit=true clientAfterInit=true sameClientAsBefore=false
[app] PORT=51812 GEN=2 pid=56852 appEvals=2 sameBunServe=false sameSentryNs=false uncaughtListeners=2 rejectionListeners=2
[instrument] evaluated#3 pid=56852 clientBeforeInit=true clientAfterInit=true sameClientAsBefore=false
[app] PORT=51812 GEN=3 pid=56852 appEvals=3 sameBunServe=false sameSentryNs=false uncaughtListeners=3 rejectionListeners=3
```

hot-debug.log (`SENTRY_DEBUG=1`, after one edit, 3 requests):

```
$ grep -c 'Initializing Sentry' hot-debug.log            -> 2
$ grep -c 'Starting sampled root span' hot-debug.log     -> 6
$ grep -c 'Sending span envelope' hot-debug.log          -> 6   (6 distinct trace ids)
$ grep -E "Captured error event|already been captured" hot-debug.log | sort | uniq -c
   1 Sentry Logger [log]: Captured error event `route boom gen2`
   1 Sentry Logger [log]: Captured error event `sentinel-d2`
   1 Sentry Logger [log]: Not capturing exception because it's already been captured.
```

Neither `Initializing Sentry` line is preceded or followed by a warning about a prior init.

`--hot --preload` after 1 edit (drive-hot-preload-2.log) — one span per request again:

```
event exception="route boom gen2" mechanism=auto.http.bun.serve handled=false
event exception="sentinel-p2" mechanism=generic handled=true
span ["http.server GET /hello/:name"] trace=b05aa1241072426087efae8522e9f4ca
span ["http.server GET /error"] trace=4e9ab99e34094c17968b6f036e86edb7
span ["http.server GET /sentinel/:tag"] trace=40a90688caa44e8fbfe70f386c7a5f0b
```

hot-preload.log:

```
[instrument] evaluated#1 pid=57721 clientBeforeInit=false clientAfterInit=true sameClientAsBefore=false
[app] PORT=51812 GEN=1 pid=57721 appEvals=1 sameBunServe=true sameSentryNs=true uncaughtListeners=1 rejectionListeners=1
[app] PORT=51812 GEN=2 pid=57721 appEvals=2 sameBunServe=true sameSentryNs=false uncaughtListeners=1 rejectionListeners=1
```

### Differences from the record

- The Bun 1.3.14 CI pin (`$S/bun1314/`) no longer exists on this machine, so only bun 1.4.0 was run.
  The record says 1.3.14 behaved the same.
- Ports are 51811/51812 here (47311/47312 in the record; 47311 was in use by another sink).
- The server body lives in `server.ts`, shared by both entries, instead of being duplicated in
  `app.ts` and `app-preload.ts`. The `const GEN = 1;` marker that the `sed` edits stays in each entry,
  so the reload trigger is unchanged.
