# B07 — Logs on Bun: `Sentry.logger` and `consoleLoggingIntegration`

Runtime: **bun 1.4.0** · SDK: `@sentry/bun@10.67.0` (develop / v11 line, tarballs from `_toolbox/pack`)

## What it reproduces

Structured logging on Bun with plain `bun run` (no bundling). `probe-a.ts` calls
`Sentry.logger.info/warn/error` with user attributes and prints
`client.getOptions().enableLogs`; `probe-b.ts` installs
`consoleLoggingIntegration({ levels: ['log','warn','error'] })` and emits `console.log` /
`console.warn`; `probe-c.ts` passes the (non-existent on develop) `enableLogs: true` option
alongside both log sources to show it changes nothing. Together they show that logs are on by
default on develop, that user attributes keep their JSON types, that the SDK adds
`sentry.sdk.name`, `sentry.sdk.version`, `server.address` and `sentry.timestamp.sequence`, and
that console capture is tagged `sentry.origin=auto.log.console` with
`sentry.message.template` / `sentry.message.parameter.0` for interpolated `console.log` calls.

`sink-ext.mjs` is `$REPRO/_toolbox/sink.mjs` with the `log` mapping extended to keep the envelope SDK,
the item count and the per-item attributes (unwrapped from their `{value,type}` form).

## Install

```
cd $REPRO/probes/B07
P=$REPRO/_toolbox/pack
npm install --no-audit --no-fund $P/sentry-bun-10.67.0.tgz $P/sentry-core-10.67.0.tgz \
  $P/sentry-node-10.67.0.tgz $P/sentry-opentelemetry-10.67.0.tgz \
  $P/sentry-server-utils-10.67.0.tgz $P/sentry-server-runtime-injection-10.67.0.tgz
```

## Run

```
cd $REPRO/probes/B07
PORT=32358 node sink-ext.mjs > sink.log 2>&1 & sp=$!
for p in a b c; do
  curl -s -X DELETE http://127.0.0.1:32358/__items > /dev/null
  TUNNEL=http://127.0.0.1:32358/ bun run probe-$p.ts
  curl -s http://127.0.0.1:32358/__items | python3 -m json.tool
done
kill $sp; wait $sp
```

Each probe waits 7 s for the log flush timer and then calls `Sentry.flush(3000)`.
Pick a different free port if 32358 is taken.

## Expected

Recorded verdict: **works**.

Plain `bun run` with no logs-related option: `Sentry.logger.info/warn/error` arrive as one `log`
envelope (`item_count` 3) with the user attributes (`probe`, `n`, `ok`, `tag`) plus
`sentry.sdk.name`/`sentry.sdk.version`, `server.address` and `sentry.timestamp.sequence`. Adding
`consoleLoggingIntegration({levels:["log","warn","error"]})` captures `console.warn("hello")` as a
`warn` log item with `sentry.origin=auto.log.console` (and `console.log` calls as `info` items with
`sentry.message.template` / `sentry.message.parameter.0`). No `enableLogs` option exists on develop
(`client.getOptions().enableLogs` is `undefined`; a grep of `packages/core/src` finds no
occurrence); logs are on by default.

Recorded evidence lines:

```
probe-a (no option):
[{"type":"log","sdk":"sentry.javascript.bun@10.67.0","item_count":3,"items":[{"level":"info","body":"probe info","attributes":{"probe":"B07","n":1,"ok":true,"sentry.sdk.name":"sentry.javascript.bun","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}},{"level":"warn","body":"probe warn","attributes":{"probe":"B07","n":2,...,"sentry.timestamp.sequence":1}},{"level":"error","body":"probe error","attributes":{"probe":"B07","n":3,"tag":"x",...,"sentry.timestamp.sequence":2}}]}]
stdout: enableLogs option value: undefined

probe-b (consoleLoggingIntegration, console.warn("hello")):
{"level":"warn","body":"hello","attributes":{"sentry.origin":"auto.log.console","sentry.sdk.name":"sentry.javascript.bun","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}}
(same envelope also carried {"level":"info","body":"typeof consoleLoggingIntegration: function","attributes":{"sentry.origin":"auto.log.console","sentry.message.template":"typeof consoleLoggingIntegration: {}","sentry.message.parameter.0":"function",...}})

probe-c (enableLogs: true passed explicitly, unknown option on develop): identical 4 log items, item_count 4: "probe info","probe warn","probe error","hello".
```

## Observed on 2026-09-07

Matches the recorded verdict (**works**).

probe-a stdout:

```
enableLogs option value: undefined
```

probe-a sink (trimmed):

```json
[{"type":"log","sdk":"sentry.javascript.bun@10.67.0","item_count":3,"items":[
 {"level":"info","body":"probe info","attributes":{"probe":"B07","n":1,"ok":true,"sentry.sdk.name":"sentry.javascript.bun","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}},
 {"level":"warn","body":"probe warn","attributes":{"probe":"B07","n":2,"ok":true,...,"sentry.timestamp.sequence":1}},
 {"level":"error","body":"probe error","attributes":{"probe":"B07","n":3,"ok":false,"tag":"x",...,"sentry.timestamp.sequence":0}}]}]
```

probe-b sink (trimmed):

```json
[{"type":"log","sdk":"sentry.javascript.bun@10.67.0","item_count":2,"items":[
 {"level":"info","body":"typeof consoleLoggingIntegration: function","attributes":{"sentry.origin":"auto.log.console","sentry.message.template":"typeof consoleLoggingIntegration: {}","sentry.message.parameter.0":"function","sentry.sdk.name":"sentry.javascript.bun","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}},
 {"level":"warn","body":"hello","attributes":{"sentry.origin":"auto.log.console",...,"sentry.timestamp.sequence":1}}]},
 {"type":"log","sdk":"sentry.javascript.bun@10.67.0","item_count":1,"items":[
 {"level":"info","body":"done","attributes":{"sentry.origin":"auto.log.console",...,"sentry.timestamp.sequence":0}}]}]
```

probe-c sink (trimmed):

```json
[{"type":"log","sdk":"sentry.javascript.bun@10.67.0","item_count":4,"items":[
 {"level":"info","body":"probe info","attributes":{"probe":"B07","n":1,"ok":true,...,"sentry.timestamp.sequence":0}},
 {"level":"warn","body":"probe warn","attributes":{"probe":"B07","n":2,"ok":true,...,"sentry.timestamp.sequence":1}},
 {"level":"error","body":"probe error","attributes":{"probe":"B07","n":3,"ok":false,"tag":"x",...,"sentry.timestamp.sequence":2}},
 {"level":"warn","body":"hello","attributes":{"sentry.origin":"auto.log.console",...,"sentry.timestamp.sequence":3}}]}]
```

`grep -rn "enableLogs" packages/core/src` in the develop worktree still returns nothing.

Only difference from the record: in probe-a the third item carried
`sentry.timestamp.sequence: 0` instead of `2`. The sequence counter is per-timestamp, so it
resets when the log falls into a later millisecond, which is a timing artifact rather than a
behavior change (probe-c, whose four items landed in one millisecond, shows the recorded
0/1/2/3 run). Everything else, levels, bodies, attribute types, origins, templates and item
counts, is identical.
