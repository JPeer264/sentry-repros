# B04 — Incoming trace continuation on Bun.serve and node:http

Runtime: bun 1.4.0. SDK: `@sentry/bun` 10.67.0 from the `develop` tarballs in
`$REPRO/_toolbox/pack`
(mirrored at `$REPRO/_toolbox/pack`). Do not install 10.73.0.

## What it reproduces

One Bun process runs two servers, a `Bun.serve` server and a `node:http` server, both instrumented by
`@sentry/bun`. A plain `curl` hits `/out` on each with a `sentry-trace` and `baggage` header carrying a
known trace id (`aaaa…a1` / `cccc…c2`) and a known span id (`bbbb…b1` / `dddd…d2`). Each handler makes
an outgoing request to a third, uninstrumented node server that records the trace headers it receives.
The probe shows that both server flavours continue the incoming trace, the server span has
`trace_id` = the supplied trace id and `parent_span_id` = the supplied span id, and the outgoing request
made inside the handler carries that same trace id downstream. It runs under both trace lifecycles:
`static` (transaction envelopes with nested `spans[]`) and the default `stream` (span envelopes, the
`http.server` span is the segment).

## Install

```
cd $REPRO/probes/B04 && npm install
```

`package.json` pins the six `develop` tarballs by relative path under `_toolbox/pack`
(`@sentry/{bun,node,core,opentelemetry,server-utils,server-runtime-injection}` at 10.67.0).

## Run

`run.sh` starts the envelope sink (`sink.mjs`), the uninstrumented downstream server
(`downstream.mjs`) and the app (`bun app.ts`), sends the two traced requests, then sends a sentinel
through each server and waits until both sentinels and both incoming trace ids are in the sink before
printing. It kills everything it started.

```
cd $REPRO/probes/B04
SINK_PORT=51461 DS_PORT=51462 BUN_PORT=51463 NODE_PORT=51464 LIFECYCLE=static ./run.sh > run-static.log 2>&1
SINK_PORT=51451 DS_PORT=51452 BUN_PORT=51453 NODE_PORT=51454 LIFECYCLE=stream ./run.sh > run-stream.log 2>&1
```

The requests the script sends:

```
curl -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1-bbbbbbbbbbbbbbb1-1' \
     -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1,sentry-sample_rate=1' \
     http://127.0.0.1:$BUN_PORT/out
curl -H 'sentry-trace: ccccccccccccccccccccccccccccccc2-ddddddddddddddd2-1' \
     -H 'baggage: sentry-trace_id=ccccccccccccccccccccccccccccccc2,sentry-sample_rate=1' \
     http://127.0.0.1:$NODE_PORT/out
```

## Expected

Recorded verdict: **works**. Both `Bun.serve` and a `node:http` server continue the incoming trace: the
server transaction has `trace_id` = the curl-supplied id and `parent_span_id` = the supplied span id, and
the fetch made inside each handler carries that same trace id downstream (`sentry-trace` + `baggage`
recorded by the plain downstream node server). Verified with `traceLifecycle: 'static'` and with the
default `'stream'` lifecycle (`http.server` is the segment with `parent_span_id` = the incoming span id),
on bun 1.4.0.

Recorded evidence lines:

```
run-static-b.log (traceLifecycle static, bun 1.4.0):
{"type":"transaction","name":"GET /out","op":"http.server","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"94a515ace9ddb98e","parent_span_id":"bbbbbbbbbbbbbbb1","origin":"auto.http.bun.serve","spans":[{"d":"http.client GET http://127.0.0.1:42690/from-bun","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"95f1599d412a028f","parent_span_id":"94a515ace9ddb98e"}]}
{"type":"transaction","name":"GET /out","op":"http.server","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"9215f2162544e238","parent_span_id":"ddddddddddddddd2","origin":"auto.http.server","spans":[{"d":"http.client GET http://127.0.0.1:42690/from-node","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"9c2a719079b31c3c","parent_span_id":"9215f2162544e238"}]}
--- downstream headers
{"url":"/from-bun","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1-95f1599d412a028f-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1,sentry-sample_rate=1,sentry-sample_rand=0.9148925561280177"}
{"url":"/from-node","sentry-trace":"ccccccccccccccccccccccccccccccc2-9c2a719079b31c3c-1","baggage":"sentry-trace_id=ccccccccccccccccccccccccccccccc2,sentry-sample_rate=1,sentry-sample_rand=0.6322913087619095"}

run-stream-d.log (default stream lifecycle):
{"type":"span","items":[{"d":"http.client GET 127.0.0.1","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"ac334e273e32dc30","parent_span_id":"99706f8252558a77","segment":false},{"d":"http.server GET","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"99706f8252558a77","parent_span_id":"bbbbbbbbbbbbbbb1","segment":true}]}
{"type":"span","items":[{"d":"http.client GET 127.0.0.1","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"894731b095eae117","parent_span_id":"92d76febb95aeba9","segment":false},{"d":"http.server GET","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"92d76febb95aeba9","parent_span_id":"ddddddddddddddd2","segment":true}]}
{"url":"/from-bun","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1-ac334e273e32dc30-1",...}
{"url":"/from-node","sentry-trace":"ccccccccccccccccccccccccccccccc2-894731b095eae117-1",...}
```

## Observed on 2026-09-07

Matches the recorded verdict. `run-static.log` (bun 1.4.0, `@sentry/bun` 10.67.0 develop tarballs):

```
{"type":"transaction","name":"GET /out","op":"http.server","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"8b90c10596b67306","parent_span_id":"bbbbbbbbbbbbbbb1","origin":"auto.http.bun.serve","spans":[{"d":"http.client GET http://127.0.0.1:51462/from-bun","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"b80b9fa5d088bd77","parent_span_id":"8b90c10596b67306"}]}
{"type":"transaction","name":"GET /out","op":"http.server","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"827943b6e3525ab1","parent_span_id":"ddddddddddddddd2","origin":"auto.http.server","spans":[{"d":"http.client GET http://127.0.0.1:51462/from-node","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"aaffed0fe8ed3257","parent_span_id":"827943b6e3525ab1"}]}
--- downstream headers
{"url":"/from-bun","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1-b80b9fa5d088bd77-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1,sentry-sample_rate=1,sentry-sample_rand=0.34358017493362003"}
{"url":"/from-node","sentry-trace":"ccccccccccccccccccccccccccccccc2-aaffed0fe8ed3257-1","baggage":"sentry-trace_id=ccccccccccccccccccccccccccccccc2,sentry-sample_rate=1,sentry-sample_rand=0.5538163087831718"}
```

`run-stream.log` (default stream lifecycle):

```
{"type":"span","items":[{"d":"http.client GET 127.0.0.1","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"98257633453c1885","parent_span_id":"9f3335ff97b0d3bb","segment":false,"origin":"auto.http.fetch"},{"d":"http.server GET","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1","span_id":"9f3335ff97b0d3bb","parent_span_id":"bbbbbbbbbbbbbbb1","segment":true,"origin":"auto.http.bun.serve"}]}
{"type":"span","items":[{"d":"http.client GET 127.0.0.1","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"8254ec980f73d30d","parent_span_id":"ba8610bd52d798d2","segment":false,"origin":"auto.http.client"},{"d":"http.server GET","trace_id":"ccccccccccccccccccccccccccccccc2","span_id":"ba8610bd52d798d2","parent_span_id":"ddddddddddddddd2","segment":true,"origin":"auto.http.server"}]}
--- downstream headers
{"url":"/from-bun","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1-98257633453c1885-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1,sentry-sample_rate=1,sentry-sample_rand=0.1551429280609351"}
{"url":"/from-node","sentry-trace":"ccccccccccccccccccccccccccccccc2-8254ec980f73d30d-1","baggage":"sentry-trace_id=ccccccccccccccccccccccccccccccc2,sentry-sample_rate=1,sentry-sample_rand=0.1144716558848956"}
```

Differences from the record, none of them behavioural:

- The rebuilt sink also prints `origin` per streamed span, so the stream lines carry
  `auto.http.bun.serve`, `auto.http.fetch` and `auto.http.client`. The record's stream lines were
  printed without that field.
- The rebuilt `run.sh` takes preset ports (the record's original `run.sh` picked `$RANDOM` ports and hit
  `EADDRINUSE` twice, which is why the record has a `run2.sh`), and it waits for the two incoming trace
  ids in the sink in addition to the two sentinels: under the stream lifecycle the sentinel events are
  flushed before the span envelopes, so waiting on the sentinels alone printed no span items.
- The readiness probe (`GET /health` on the Bun server) shows up as an extra `http.server` item with its
  own trace id. It is noise from the harness, not part of the claim.

## Files

- `instrument.ts` — `Sentry.init` with `tunnel` to the sink, `tracesSampleRate: 1.0`, `traceLifecycle` from `$LIFECYCLE`
- `app.ts` — the Bun.serve server and the node:http server, both with `/out`, `/sentinel`
- `downstream.mjs` — uninstrumented node server, records incoming trace headers, serves them at `/__headers`
- `sink.mjs` — envelope sink, extended from the toolbox one to keep `trace_id` / `span_id` / `parent_span_id`
- `run.sh` — the whole run
- `run-static.log`, `run-stream.log` — the two runs above
