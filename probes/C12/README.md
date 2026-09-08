# C12 — Sessions, metrics and logs on Workers (`@sentry/cloudflare`, develop / 10.67.0)

## What it reproduces

A single Cloudflare Worker wrapped in `withSentry` (release `c12@1.0.0`, environment `c12`,
`consoleLoggingIntegration`, envelopes tunneled to a local sink) is driven through three phases to see
which telemetry families actually reach the transport on Workers. `Sentry.metrics.count`/`gauge` and
`Sentry.logger.info` plus `console.log`/`console.warn` arrive as `trace_metric` and `log` envelopes,
drained at the end of the request that produced them, so they are in the sink before the next request's
`span` envelope, with no 7 s timer wait and no explicit `ctx.waitUntil(Sentry.flush())` needed (the
explicit-flush variant works too). Sessions are the missing third: two OK requests plus one throwing
request with a release set produce only `span` envelopes and the error event, no `session` or `sessions`
envelope ever appears, and `@sentry/cloudflare` exports no `startSession`/`captureSession`/`endSession`,
so release health is unavailable on Workers. Verdict: **partial**.

## Install

```
cd $REPRO/probes/C12 && npm install
```

(the `@sentry/*` deps are the develop tarballs in `../../_toolbox/pack`)

## Run

```
cd $REPRO/probes/C12
PORT=44712 RAW=$PWD/raw.log node sink.mjs > sink.log 2>&1 &
npx wrangler dev --port 44711 --inspector-port 0 > app.log 2>&1 &   # wait for 'Ready on http://localhost:44711'

node drive.mjs http://127.0.0.1:44711 http://127.0.0.1:44712 sessions
curl -s -X DELETE http://127.0.0.1:44712/__items
node drive.mjs http://127.0.0.1:44711 http://127.0.0.1:44712 telemetry
curl -s -X DELETE http://127.0.0.1:44712/__items
node drive.mjs http://127.0.0.1:44711 http://127.0.0.1:44712 flush
```

Kill both background pids when done (capture them with `pid=$!` at start).

## Expected

Recorded verdict: **partial**. Metrics and logs work; sessions are absent.

Recorded evidence:

```
sessions phase (release c12@1.0.0, /ok, /ok, /error, /sentinel):
[{"type":"span","items":["http.server GET"]},
{"type":"span","items":["http.server GET"]},
{"type":"event","exception":"c12 route boom","mechanism":"auto.http.cloudflare","handled":false,"release":"c12@1.0.0","sdk":"sentry.javascript.cloudflare"},
{"type":"span","items":["http.server GET"]},
{"type":"event","message":"sentinel 1",...},
{"type":"span","items":["http.server GET"]}]
(no "session"/"sessions" item; raw.log item types: event, span, log, trace_metric only)

telemetry phase (/telemetry, then /ok every 2s for 8s, then /sentinel):
{"type":"log","items":["info: c12 logger info {\"route\":\"/telemetry\",\"sentry.release\":\"c12@1.0.0\",\"sentry.environment\":\"c12\",\"sentry.trace.parent_span_id\":\"9c734ae3eea5f044\",\"sentry.timestamp.sequence\":2}","info: c12 console log {\"route\":\"/telemetry\"} {\"sentry.origin\":\"auto.log.console\",\"sentry.message.template\":\"c12 console log {}\",...}","warn: c12 console warn {\"sentry.origin\":\"auto.log.console\",...}"]},
{"type":"trace_metric","items":["counter c12.requests=1 {\"route\":\"/telemetry\",\"sentry.release\":\"c12@1.0.0\",\"sentry.environment\":\"c12\",\"sentry.timestamp.sequence\":0}","gauge c12.gauge=42 millisecond {\"route\":\"/telemetry\",...,\"sentry.timestamp.sequence\":1}"]},
{"type":"span","items":["http.server GET"]}, ... {"type":"event","message":"sentinel 2",...}

flush phase (/telemetry, /flush with ctx.waitUntil(Sentry.flush(2000)), /sentinel): "type":"log" "type":"trace_metric" "type":"span" "type":"span" "type":"event" "type":"span"
```

Recorded notes: neither session envelopes nor session APIs exist on `@sentry/cloudflare`; log attributes
carry `sentry.trace.parent_span_id`, release, environment and, for `consoleLoggingIntegration`,
`sentry.origin=auto.log.console` plus `sentry.message.template`/`sentry.message.parameter.0`;
`Sentry.captureMessage` on develop produces an event that carries both `message` and a synthetic
`exception.values[0]`.

## Observed on 2026-09-07

Matches the recorded verdict (**partial**).

sessions phase (trimmed):

```
[{"type":"span","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]},
{"type":"span","items":["http.server GET"],...},
{"type":"event","exception":"Error: c12 route boom","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","release":"c12@1.0.0","environment":"c12"},
{"type":"span","items":["http.server GET"],...},
{"type":"event","message":"sentinel 1","exception":"undefined: sentinel 1","mechanism":"generic","handled":true,...},
{"type":"span","items":["http.server GET"],...}]
session-ish items: []
raw.log item types: ['event', 'log', 'span', 'trace_metric']
grep -c "startSession\|captureSession\|endSession" node_modules/@sentry/cloudflare/build/types/index.d.ts -> 0
```

telemetry phase (trimmed):

```
GET /telemetry -> 200 /telemetry ok
GET /ok -> 200 ok
t+2s types: ["log","trace_metric","span","span"]
t+4s types: ["log","trace_metric","span","span","span"]
t+6s types: ["log","trace_metric","span","span","span","span"]
t+8s types: ["log","trace_metric","span","span","span","span","span"]

{"type":"log","items":["info: c12 logger info {\"route\":\"/telemetry\",\"sentry.release\":\"c12@1.0.0\",\"sentry.environment\":\"c12\",\"sentry.sdk.name\":\"sentry.javascript.cloudflare\",\"sentry.sdk.version\":\"10.67.0\",\"sentry.trace.parent_span_id\":\"9574760944b12af7\",\"sentry.timestamp.sequence\":0}","info: c12 console log {\"route\":\"/telemetry\"} {\"sentry.origin\":\"auto.log.console\",\"sentry.message.template\":\"c12 console log {}\",\"sentry.message.parameter.0\":\"{\\\"route\\\":\\\"/telemetry\\\"}\",...}","warn: c12 console warn {\"sentry.origin\":\"auto.log.console\",...}"]}
{"type":"trace_metric","items":["counter c12.requests=1 {\"route\":\"/telemetry\",\"sentry.release\":\"c12@1.0.0\",\"sentry.environment\":\"c12\",...,\"sentry.timestamp.sequence\":0}","gauge c12.gauge=42 millisecond {\"route\":\"/telemetry\",...,\"sentry.timestamp.sequence\":1}"]}
```

flush phase (trimmed):

```
["log","trace_metric","span","log","trace_metric","span","event","span"]
{"type":"log","items":["info: c12 logger info {\"route\":\"/flush\",...,\"sentry.trace.parent_span_id\":\"b5292e04aac5a882\",...}",...]}
{"type":"trace_metric","items":["counter c12.requests=1 {\"route\":\"/flush\",...}","gauge c12.gauge=42 millisecond {\"route\":\"/flush\",...}"]}
```

Only difference from the record: in this rebuild the `/flush` route emits the same log/metric payload as
`/telemetry` before calling `ctx.waitUntil(Sentry.flush(2000))`, so the flush phase shows
`log, trace_metric, span, log, trace_metric, span, event, span` where the record shows
`log, trace_metric, span, span, event, span`. The recorded conclusion is unchanged: the explicit-flush
variant delivers the same envelopes, and the flush is not what makes them arrive.
