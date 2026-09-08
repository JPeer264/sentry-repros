# B05 — Release health sessions on Bun

## What it reproduces

On Bun with `@sentry/bun` at develop (10.67.0, v11 line), a `Bun.serve` app initialised with
`release: "1.0.0"` and otherwise default options never produces a `sessions` aggregate envelope:
not after a sentinel event, not at the 60 second flush (t+65s), and not after the process exits.
The only release-health data is the single process session created by `processSessionIntegration`,
and a thrown error inside the `Bun.serve` fetch handler is captured with `handled: false`
(`mechanism: auto.http.bun.serve`), which flips that process session to the terminal status
`crashed` and sends it immediately, even though Bun caught the throw, answered 500 and the process
keeps serving. A `node:http` server on the same runtime does get request session aggregates
(`bunHttpServerIntegration`, sessions on by default): with a handled `captureException` the
`sessions` envelope arrives at the 60s flush with `exited: 3, errored: 1` and the process session
is later sent as `exited` at `beforeExit`; with a throwing handler the throw becomes an uncaught
exception that kills the process, so the aggregate is flushed on the way down with `exited: 2`
(the crashed request is not counted in the aggregate) plus a `crashed` process session.

## Install

```
cd $REPRO/probes/B05
npm install
```

(`package.json` points at the develop tarballs in `../../_toolbox/pack/*-10.67.0.tgz`:
`@sentry/{bun,node,core,opentelemetry,server-utils,server-runtime-injection}`. Use `npm install`,
not `bun add`: bun cannot resolve the tarballs' transitive `@sentry/*@10.67.0` deps.)

## Run

```
cd $REPRO/probes/B05
./run.sh app-bunserve.ts        41348 41248 > out-bunserve.txt        2>&1
./run.sh app-nodehttp.ts        41328 41228 > out-nodehttp.txt        2>&1
./run.sh app-nodehttp-handled.ts 41338 41238 > out-nodehttp-handled.txt 2>&1
```

`run.sh <app file> <app port> <sink port>` starts the envelope sink itself
(`PORT=<sink port> node sink.mjs`, a copy of `$REPRO/_toolbox/sink.mjs` extended to compact `session` and
`sessions` envelopes and to print an exception's `value` only), waits for the app on a TCP-only
readiness check (an HTTP probe would add one more request session to the aggregate), curls
`/ok1 /ok2 /error /sentinel`, polls the sink until the sentinel event has arrived, prints the sink,
sleeps 65s past the session flush interval and prints the sink again, curls `/stop` so the app
exits through `beforeExit`, prints the sink a third time, then kills the sink. Each run writes
`app-<app port>.log` and `sink-<sink port>.log`. Pick your own free ports in 20000-60000.

## Expected

Recorded verdict: **partial**.

Recorded evidence lines:

```
Bun.serve (out3-bunserve.txt), sink after sentinel and unchanged at t+65s and after exit:
[{"type":"session","status":"crashed","errors":1,"init":true,"release":"1.0.0","sid":"b3f8e0949d964b969ed1332b656a3ea2"},{"type":"event","exception":"bunserve boom","mechanism":"auto.http.bun.serve","handled":false,"release":"1.0.0"},{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"release":"1.0.0"}]
app exit code 1  (no `sessions` item at any point)

node:http throwing handler (out3-nodehttp.txt), error -> HTTP 200, sink after sentinel:
[{"type":"sessions","attrs":{"release":"1.0.0","environment":"production"},"aggregates":[{"started":"2026-09-04T09:02:00.000Z","exited":2,"errored":0,"crashed":0}]},{"type":"session","status":"crashed","errors":1,"init":true,"release":"1.0.0","sid":"7b443686bdf146998dad2af36c0d3e66"},{"type":"event","exception":"nodehttp boom","mechanism":"auto.node.onuncaughtexception","handled":false,"release":"1.0.0"}]
app exit code 1 (process died from the uncaught exception, no sentinel arrived)

node:http handled captureException (out2-nodehttp-handled.txt), sink at t+65s:
[{"type":"session","status":"ok","errors":1,"init":true,"release":"1.0.0","sid":"46ef28d17d524013921d5b011e985238"},{"type":"event","exception":"nodehttp handled boom","mechanism":"generic","handled":true,"release":"1.0.0"},{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"release":"1.0.0"},{"type":"sessions","attrs":{"release":"1.0.0","environment":"production"},"aggregates":[{"started":"2026-09-04T09:00:00.000Z","exited":3,"errored":1,"crashed":0}]}]
sink after process exit adds: {"type":"session","status":"exited","errors":1,"init":false,"release":"1.0.0","sid":"46ef28d17d524013921d5b011e985238"}
app exit code 0
```

## Observed on 2026-09-07

Matches the recorded verdict. Bun 1.4.0, `@sentry/bun` 10.67.0 from the develop tarballs. Lines
below are trimmed to the fields the record keeps (`sdk`, `runtime`, `hasContextLine`, `trace_id`,
`request`, `user`, `environment` also present in the raw output).

Bun.serve (`out-bunserve.txt`), sink after sentinel, unchanged at t+65s and after exit:

```
[{"type":"session","status":"crashed","errors":1,"init":true,"release":"1.0.0","sid":"ce5836bba6dc4aa78dc0b8c05f95218f"},{"type":"event","exception":"bunserve boom","mechanism":"auto.http.bun.serve","handled":false,"release":"1.0.0"},{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"release":"1.0.0"}]
error -> 500, app exit code 1   (grep -c '"type":"sessions"' out-bunserve.txt -> 0)
```

node:http throwing handler (`out-nodehttp.txt`), error -> HTTP 200, sink after sentinel:

```
[{"type":"sessions","attrs":{"release":"1.0.0","environment":"production"},"aggregates":[{"started":"2026-09-07T08:54:00.000Z","exited":2,"errored":0,"crashed":0}]},{"type":"session","status":"crashed","errors":1,"init":true,"release":"1.0.0","sid":"11922351632b4e55acfd7d5b6ecd4431"},{"type":"event","exception":"nodehttp boom","mechanism":"auto.node.onuncaughtexception","handled":false,"release":"1.0.0"}]
sentinel -> 000 (process already dead), app exit code 1
```

node:http handled captureException (`out-nodehttp-handled.txt`), sink at t+65s:

```
[{"type":"session","status":"ok","errors":1,"init":true,"release":"1.0.0","sid":"811604baef024cdfadf71ee7beb1d6d9"},{"type":"event","exception":"nodehttp handled boom","mechanism":"generic","handled":true,"release":"1.0.0"},{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"release":"1.0.0"},{"type":"sessions","attrs":{"release":"1.0.0","environment":"production"},"aggregates":[{"started":"2026-09-07T08:56:00.000Z","exited":3,"errored":1,"crashed":0}]}]
sink after process exit adds: {"type":"session","status":"exited","errors":1,"init":false,"release":"1.0.0","sid":"811604baef024cdfadf71ee7beb1d6d9"}
app exit code 0
```

Only difference from the record: none in substance. The first run of `app-nodehttp.ts` used an
HTTP `/ok1` readiness probe and reported `exited: 3` instead of `exited: 2`, because that probe is
itself a counted request session; `run.sh` now waits on a bare TCP connect, and the rerun
(`out-nodehttp.txt`, ports 41328/41228) reproduces `exited: 2` exactly. Stale `app-4131*.log` /
`sink-4121*.log` files from that first attempt are still in the directory.
