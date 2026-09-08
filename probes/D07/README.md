# D07 — Logs on Deno: `Sentry.logger` and `consoleLoggingIntegration`

## What it reproduces

On Deno with `@sentry/deno` from the develop line (v11, package version 10.67.0), structured logs work
with no log-related option at all: `Sentry.init({ dsn, tunnel })` alone is enough for every
`Sentry.logger.*` level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) plus `Sentry.logger.fmt`
to reach the transport in a single `log` envelope, flushed by the SDK's own timer without any explicit
`Sentry.flush()`. Bodies, levels, severity numbers, user-supplied attributes and the
`sentry.message.template` / `sentry.message.parameter.N` attributes of `fmt` are all correct. A second
probe shows `Sentry.consoleLoggingIntegration()` turning `console.warn/error/info/log` into log items
tagged `sentry.origin: auto.log.console`, again with no other option set. A third control probe passes
`enableLogs: true` and shows it changes nothing, because the option no longer exists on this line.

## Install

```
npm install
```

(installs the develop-line tarballs from `../../_toolbox/pack/` — `@sentry/deno`, `@sentry/core`,
`@sentry/server-utils`, `@sentry/server-runtime-injection` at 10.67.0; `deno.json` sets
`nodeModulesDir: "manual"` so Deno uses that `node_modules`.)

## Run

```
cd $REPRO/probes/D07
P=41877
PORT=$P RAW=$PWD/raw-d07.log node sink-d07.mjs > sink-d07.log 2>&1 &
sink=$!
curl -s -X DELETE http://127.0.0.1:$P/__items

SINK_PORT=$P deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-logger.ts
curl -s http://127.0.0.1:$P/__items > probe-logger.items.json
curl -s -X DELETE http://127.0.0.1:$P/__items

SINK_PORT=$P deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-console.ts
curl -s http://127.0.0.1:$P/__items > probe-console.items.json
curl -s -X DELETE http://127.0.0.1:$P/__items

SINK_PORT=$P deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys probe-console-enablelogs.ts
curl -s http://127.0.0.1:$P/__items > probe-console-enablelogs.items.json

kill $sink; wait $sink
```

Each probe waits 7 seconds after its log calls so the flush timer fires; neither calls `Sentry.flush()`.
`sink-d07.mjs` is `$S/qs/sink.mjs` with the `log` compaction extended to keep `item_count`,
`content_type`, `severity_number`, `trace_id` presence and flattened attributes, plus a `RAW` env var
that appends every raw envelope body to a file.

## Expected

Recorded verdict: **works**.

Recorded evidence:

`probe-logger.items.json` (one envelope):

```
{"type":"log","item_count":7,"content_type":"application/vnd.sentry.items.log+json","items":[{"level":"trace","body":"trace line","severity_number":1,"trace_id":"present",...},{"level":"debug","body":"debug line","severity_number":5,...},{"level":"info","body":"info line","severity_number":9,"trace_id":"present","attributes":{"route":"/probe","count":3,"ok":true,"sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":1}},{"level":"warn","body":"warn line","severity_number":13,...},{"level":"error","body":"error line","severity_number":17,"attributes":{"err":"E1",...}},{"level":"fatal","body":"fatal line","severity_number":21,...},{"level":"info","body":"fmt user alice id 42","severity_number":9,"attributes":{"sentry.message.template":"fmt user %s id %s","sentry.message.parameter.0":"alice","sentry.message.parameter.1":42,...}}]}
```

`probe-console.items.json` (one envelope):

```
{"type":"log","item_count":4,"content_type":"application/vnd.sentry.items.log+json","items":[{"level":"warn","body":"console warn line {\"code\":7}","severity_number":13,"trace_id":"present","attributes":{"sentry.origin":"auto.log.console","sentry.message.template":"console warn line {}","sentry.message.parameter.0":"{\"code\":7}","sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0",...}},{"level":"error","body":"console error line","severity_number":17,"attributes":{"sentry.origin":"auto.log.console",...}},{"level":"info","body":"console info line","severity_number":9,...},{"level":"info","body":"console log line","severity_number":10,...}]}
```

probe stdout: `DONE logger calls, waiting 7s, no explicit flush` / `EXIT` (exit=0)

Recorded notes: adding `enableLogs: true` changed nothing (the option is gone in v11); no
`@sentry/deno/import` hook was needed for logs; `console.log` maps to level `info` with
`severity_number` 10, `console.info` to 9.

## Observed on 2026-09-07

Deno 2.9.0, `@sentry/deno` 10.67.0 from `../../_toolbox/pack/`, sink on port 41877. Matches.

`probe-logger.ts` stdout (exit=0):

```
DONE logger calls, waiting 7s, no explicit flush
EXIT
```

`probe-logger.items.json` — one envelope, `item_count` 7:

```
{"type":"log","item_count":7,"content_type":"application/vnd.sentry.items.log+json","items":[
 {"level":"trace","body":"trace line","severity_number":1,"trace_id":"present","attributes":{"sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}},
 {"level":"debug","body":"debug line","severity_number":5,"trace_id":"present","attributes":{...,"sentry.timestamp.sequence":1}},
 {"level":"info","body":"info line","severity_number":9,"trace_id":"present","attributes":{"route":"/probe","count":3,"ok":true,"sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":2}},
 {"level":"warn","body":"warn line","severity_number":13,"trace_id":"present","attributes":{...,"sentry.timestamp.sequence":3}},
 {"level":"error","body":"error line","severity_number":17,"trace_id":"present","attributes":{"err":"E1",...,"sentry.timestamp.sequence":4}},
 {"level":"fatal","body":"fatal line","severity_number":21,"trace_id":"present","attributes":{...,"sentry.timestamp.sequence":5}},
 {"level":"info","body":"fmt user alice id 42","severity_number":9,"trace_id":"present","attributes":{"sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0","sentry.message.template":"fmt user %s id %s","sentry.message.parameter.0":"alice","sentry.message.parameter.1":42,"server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}}]}
```

`probe-console.items.json` — one envelope, `item_count` 4:

```
{"type":"log","item_count":4,"content_type":"application/vnd.sentry.items.log+json","items":[
 {"level":"warn","body":"console warn line {\"code\":7}","severity_number":13,"trace_id":"present","attributes":{"sentry.origin":"auto.log.console","sentry.message.template":"console warn line {}","sentry.message.parameter.0":"{\"code\":7}","sentry.sdk.name":"sentry.javascript.deno","sentry.sdk.version":"10.67.0","server.address":"DJ90J9R5XC.local","sentry.timestamp.sequence":0}},
 {"level":"error","body":"console error line","severity_number":17,"trace_id":"present","attributes":{"sentry.origin":"auto.log.console",...,"sentry.timestamp.sequence":1}},
 {"level":"info","body":"console info line","severity_number":9,"trace_id":"present","attributes":{"sentry.origin":"auto.log.console",...,"sentry.timestamp.sequence":2}},
 {"level":"info","body":"console log line","severity_number":10,"trace_id":"present","attributes":{"sentry.origin":"auto.log.console",...,"sentry.timestamp.sequence":3}}]}
```

`probe-console-enablelogs.items.json` (control, `enableLogs: true`) — identical shape:

```
{"type": "log", "item_count": 4, "content_type": "application/vnd.sentry.items.log+json"}
[('warn', 'console warn line {"code":7}', 13, 'auto.log.console'), ('error', 'console error line', 17, 'auto.log.console'), ('info', 'console info line', 9, 'auto.log.console'), ('info', 'console log line', 10, 'auto.log.console')]
```

Only difference from the record: in the logger envelope the `info line` item carries
`sentry.timestamp.sequence` 2 rather than the recorded 1, and the trace/debug items start the sequence
at 0. That counter is a per-millisecond tie-breaker, so it shifts with run timing; every level, body,
severity number, attribute and envelope count is as recorded. Verdict **works**, reproduced.

## Files

- `probe-logger.ts` — the six `Sentry.logger.*` levels plus `logger.fmt`, no log options, no explicit flush
- `probe-console.ts` — `consoleLoggingIntegration()` only; status lines are written straight to stdout so they are not themselves captured
- `probe-console-enablelogs.ts` — control run adding `enableLogs: true`
- `sink-d07.mjs` — envelope sink with the extended `log` mapping
- `probe-*.items.json` — the sink output of each run
- `raw-d07.log` — raw envelope bodies of all three runs
