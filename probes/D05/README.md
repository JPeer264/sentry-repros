# D05 — Release health sessions on Deno

Runtime: Deno 2.9.0. SDK: `@sentry/deno` 10.67.0 (develop, `getsentry/sentry-javascript` @ `6f2da7483d`), installed from the tarballs in `_toolbox/pack`.

## What it reproduces

`@sentry/deno` on develop tracks release-health request sessions only for `node:http` servers, not for `Deno.serve`. `main-d05.ts` runs both servers in one process with `release: "1.0.0"` and `denoHttpIntegration({ sessionFlushingDelayMS: 2000 })`. Driving three `node:http` requests (two OK, one that calls `captureException` and answers 500) produces a `sessions` aggregate envelope with `exited: 2, errored: 1`; driving `Deno.serve` alone, including a request whose handler throws, produces no session envelope at all even after 10 seconds. A third run shows that a synchronous throw inside a `node:http` request listener is swallowed by Deno's `node:http` compat layer — the client gets HTTP 400, no Sentry event is captured, and the session is still counted `exited`, so `crashed` can never be reached from `node:http` on Deno.

## Install

```
cd $REPRO/probes/D05 && npm install
```

## Run

```
D=$REPRO/probes/D05

PORT=52847 node $D/sink.mjs > $D/sink.log 2>&1 &
sinkpid=$!

cd $D && SINK_PORT=52847 SERVE_PORT=52848 HTTP_PORT=52849 ERROR_MODE=catch \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-d05.ts > $D/app-catch.log 2>&1 &
apppid=$!

node $D/drive.mjs 52847 52848 52849 catch          # 3 Deno.serve reqs (one throws), 3 node:http reqs (one captureException + 500), sentinel
node $D/drive.mjs 52847 52848 52849 throw          # same, but the node:http handler throws synchronously
node $D/drive-serve-only.mjs 52847 52848 10000     # Deno.serve only, 10s wait for sessions

kill $apppid; wait $apppid; kill $sinkpid; wait $sinkpid
```

## Expected

Recorded verdict: **partial**.

`node:http` requests are tracked as request-mode sessions: after 3 `node:http` requests (2 ok, 1 handled `captureException` + 500) a `sessions` aggregate envelope with release 1.0.0 arrived (exited 2, errored 1). `Deno.serve` requests produce no session at all (3 `Deno.serve` requests incl. one that throws, plus sentinel, 10s wait: 0 session envelopes). A handler that throws inside a `node:http` listener is swallowed by Deno's `node:http` compat (client gets HTTP 400, no Sentry event), so that session is counted as `exited`, never `crashed`.

Recorded evidence lines:

```
develop, node:http catch mode (drive-d05-catch.out):
http /error-catch -> 500
{"type":"event","exception":"http boom caught","mechanism":"generic","handled":true,"release":"1.0.0","sdk":"sentry.javascript.deno"}
{"type":"sessions","release":"1.0.0","environment":"production","aggregates":[{"started":"2026-09-04T09:06:00.000Z","exited":2,"errored":1,"crashed":0}]}
app log: Recorded request session with status: errored / Sending request session aggregate due to flushing schedule

develop, node:http throw mode (drive-d05-throw.out):
http /error-throw -> 400
(no `http boom` event in sink)
{"type":"sessions","release":"1.0.0","environment":"production","aggregates":[{"started":"2026-09-04T09:06:00.000Z","exited":3,"errored":0,"crashed":0}]}

develop, Deno.serve only (drive-d05-serve-only.out):
serve /error -> 500
waited 10000ms; session envelopes: 0
[{"type":"event","exception":"serve boom","mechanism":"auto.http.deno","handled":false,"release":"1.0.0",...},{"type":"event","message":"sentinel",...},{"type":"span","items":["http.server GET"]} x4]
```

## Observed on 2026-09-07

Matches the recorded verdict in all three runs.

`drive-catch.out`:

```
serve /ok -> 200
serve /ok -> 200
serve /error -> 500
http /ok -> 200
http /ok -> 200
http /error-catch -> 500
serve /sentinel -> 200
session envelopes: 1
{"type":"event","exception":"http boom caught","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":"deno","transaction":"GET /error-catch","release":"1.0.0","environment":"production"}
{"type":"sessions","release":"1.0.0","environment":"production","aggregates":[{"started":"2026-09-07T09:01:00.000Z","exited":2,"errored":1,"crashed":0,"abnormal":0}]}
```

`app-catch.log`:

```
Sentry Logger [log]: Recorded request session with status: ok
Sentry Logger [log]: Opened new request session aggregate.
Sentry Logger [log]: Recorded request session with status: ok
Sentry Logger [log]: Recorded request session with status: errored
Sentry Logger [log]: Sending request session aggregate due to flushing schedule
```

`drive-throw.out`:

```
http /error-throw -> 400
serve /sentinel -> 200
session envelopes: 1
{"type":"sessions","release":"1.0.0","environment":"production","aggregates":[{"started":"2026-09-07T09:02:00.000Z","exited":3,"errored":0,"crashed":0,"abnormal":0}]}
```

No `http boom thrown` event reached the sink in that run.

`drive-serve-only.out`:

```
serve /ok -> 200
serve /ok -> 200
serve /error -> 500
serve /sentinel -> 200
waited 10000ms; session envelopes: 0
[{"type":"event","exception":"serve boom","mechanism":"auto.http.deno","handled":false,...,"release":"1.0.0","environment":"production"},{"type":"event","message":"sentinel",...},{"type":"span","items":["http.server GET"]} x4]
```

## Files

- `main-d05.ts` — Deno app with a `Deno.serve` server (`/ok`, `/error`, `/sentinel`) and a `node:http` server (`/ok`, `/error-catch`, `/error-throw`)
- `drive.mjs` — drives both servers, sends the sentinel, waits for a `sessions` envelope
- `drive-serve-only.mjs` — drives `Deno.serve` only, waits a fixed time, reports the session count
- `sink.mjs` — envelope sink, extended over `_toolbox/qs/sink.mjs` to keep `sessions` attrs and aggregates
- `deno.json` — `nodeModulesDir: "manual"`
