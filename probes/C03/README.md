# C03 - Incoming trace continuation on Workers

Runtime: Cloudflare Workers (`wrangler dev` 4.129.0, workerd local) | SDK: `@sentry/cloudflare` 10.67.0
(develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A minimal Worker wrapped in `Sentry.withSentry` with its own `release: 'c03@1.0.0'` and
`environment: 'probe'` is called on `/continue` with an incoming
`sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1` plus a full upstream `baggage`
header (environment `upstream-env`, release `upstream@2.0.0`, `sample_rand=0.123456`). Inside the
handler the Worker does an outgoing `fetch` to a plain node "downstream" server that records the
`sentry-trace`/`baggage`/`traceparent` headers it receives. A second request to `/sentinel` (no trace
headers) captures a `sentinel` message so the driver knows every earlier envelope has arrived. The
probe checks three things: that the `http.server` segment span keeps the incoming trace id and parent
span id, that the envelope DSC carries the *upstream* baggage instead of the Worker's own
release/environment, and that the outgoing fetch propagates headers whose span id equals the recorded
`http.client` span. The same app is then run a second time with `tracePropagationTargets: []`
(`--var NO_PROPAGATE:1`) to check that only outgoing headers are suppressed while the incoming trace
is still continued and the `http.client` span is still recorded.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  wrangler@4
```

## Run

From this directory. Ports are arbitrary; pick free ones and keep them consistent.

```
PORT=30000 node sink.mjs > sink.log 2>&1 & spid=$!
PORT=51838 node downstream.mjs > down.log 2>&1 & dpid=$!
sleep 1

# variant 1: defaults
npx wrangler dev --port 30274 --inspector-port 0 \
  --var SINK_PORT:30000 --var DOWN_PORT:51838 > app.log 2>&1 & apid=$!
sleep 20
node probe.mjs 30274 30000 51838 > probe-default.out
kill $apid; wait $apid

# variant 2: tracePropagationTargets: []
npx wrangler dev --port 30411 --inspector-port 0 --persist-to ./persist-noprop \
  --var SINK_PORT:30000 --var DOWN_PORT:51838 --var NO_PROPAGATE:1 > app-noprop.log 2>&1 & apid2=$!
sleep 20
node probe.mjs 30411 30000 51838 > probe-noprop.out
kill $apid2; wait $apid2

kill $spid; wait $spid
kill $dpid; wait $dpid
```

`sink.mjs` is `_toolbox/sink.mjs` with the span mapping extended to keep the envelope DSC
(`envHeader.trace`) and, per span, `trace_id`/`span_id`/`parent_span_id`/`is_segment` and all
attributes; `event` also keeps `span_id`. `downstream.mjs` records the trace headers of every request
it receives and serves them on `/__seen`. `probe.mjs` clears both, drives `/continue` with the
upstream headers, then `/sentinel`, waits for the sentinel event and prints what the downstream
server saw plus every sink item.

## Expected

Recorded verdict: **works**.

With incoming `sentry-trace aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1` plus baggage, the
`http.server` segment span keeps trace_id `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab` and parent_span_id
`bbbbbbbbbbbbbbbb`, the envelope DSC carries the upstream baggage (environment `upstream-env`,
release `upstream@2.0.0`) instead of the Worker's own, and the outgoing fetch inside the handler
reached the host downstream server with `sentry-trace`/`baggage` whose span id equals the recorded
`http.client` span (`a284697ef07f0866`). With `tracePropagationTargets: []` the same request still
continues the trace but the downstream server received no `sentry-trace`/`baggage`/`traceparent`
while the `http.client` span is still recorded.

Recorded evidence lines:

```
[default] downstream saw: [{"path":"/downstream","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-a284697ef07f0866-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-environment=upstream-env,sentry-release=upstream%402.0.0,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-sample_rand=0.123456","traceparent":null}]
[default] sink: {"type":"span","dsc":{"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","environment":"upstream-env","release":"upstream@2.0.0","public_key":"public","sample_rate":"1","sampled":"true","sample_rand":"0.123456"},"items":[{"op":"http.client","name":"GET 127.0.0.1","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"a284697ef07f0866","parent_span_id":"a3e2af60d6769081","is_segment":false,"attrs":{"sentry.origin":"auto.http.fetch","url.full":"http://127.0.0.1:47212/downstream",...}},{"op":"http.server","name":"GET","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"a3e2af60d6769081","parent_span_id":"bbbbbbbbbbbbbbbb","is_segment":true,"attrs":{"sentry.origin":"auto.http.cloudflare","url.path":"/continue","http.request.header.sentry_trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1",...}}]}
[default] sink: {"type":"event","message":"sentinel","exception":"sentinel","trace_id":"bb370780effd42ef8a7ba6749757d6df","span_id":"bbdd242688630b87"}
[tracePropagationTargets: []] downstream saw: [{"path":"/downstream","sentry-trace":null,"baggage":null,"traceparent":null}]
[tracePropagationTargets: []] sink: http.server GET trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab span_id 9b5b9753437a6397 parent_span_id bbbbbbbbbbbbbbbb is_segment true; http.client "GET 127.0.0.1" trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab span_id bfa076eb7c80aac3 parent_span_id 9b5b9753437a6397
```

Recorded note: the Worker's own `c03@1.0.0` / `probe` are replaced in the DSC by the upstream baggage
values for the continued trace, while the sentinel request without incoming headers gets a fresh
trace with the Worker's own release/environment. Release in outgoing baggage is URL-encoded. No
`traceparent` (W3C) header is sent.

## Observed on 2026-09-07

**Matches** the recorded verdict. Span ids and ports differ (they are random per run); everything the
verdict asserts is identical. Full output in `probe-default.out` and `probe-noprop.out`.

```
[default] downstream saw: [{"path":"/downstream","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-87e3c996c966db50-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-environment=upstream-env,sentry-release=upstream%402.0.0,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-sample_rand=0.123456","traceparent":null}]
[default] sink: {"type":"span","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","dsc":{"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","environment":"upstream-env","release":"upstream@2.0.0","public_key":"public","sample_rate":"1","sampled":"true","sample_rand":"0.123456"},"items":[{"op":"http.client","name":"GET 127.0.0.1","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"87e3c996c966db50","parent_span_id":"8559db419830cafa","is_segment":false,"status":"ok","attrs":{"sentry.origin":"auto.http.fetch","sentry.op":"http.client","url.full":"http://127.0.0.1:51838/downstream",...}},{"op":"http.server","name":"GET","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"8559db419830cafa","parent_span_id":"bbbbbbbbbbbbbbbb","is_segment":true,"status":"ok","attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","url.path":"/continue","http.request.header.sentry_trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1","sentry.release":"c03@1.0.0","sentry.environment":"probe",...}}]}
[default] sink: {"type":"event","message":"sentinel","exception":"undefined: sentinel","trace_id":"0e96e9d06d494709a222fbea1db591d4","span_id":"9b13e159d1eb8b7d","release":"c03@1.0.0","environment":"probe"}
[default] sink: {"type":"span","trace_id":"0e96e9d06d494709a222fbea1db591d4","dsc":{"environment":"probe","release":"c03@1.0.0","public_key":"public","trace_id":"0e96e9d06d494709a222fbea1db591d4","sampled":"true","sample_rand":"0.1497159077343626","sample_rate":"1"},"items":[{"op":"http.server","name":"GET","trace_id":"0e96e9d06d494709a222fbea1db591d4","span_id":"9b13e159d1eb8b7d","is_segment":true,...}]}
[tracePropagationTargets: []] downstream saw: [{"path":"/downstream","sentry-trace":null,"baggage":null,"traceparent":null}]
[tracePropagationTargets: []] sink: http.server GET trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab span_id b9da4667ada5898d parent_span_id bbbbbbbbbbbbbbbb is_segment true; http.client "GET 127.0.0.1" trace_id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab span_id b933aaa2995e500e parent_span_id b9da4667ada5898d
```

Only cosmetic difference from the record: the sentinel event's compact `exception` field prints as
`undefined: sentinel` here because this sink formats it as `${type}: ${value}` and the synthetic
message event carries no exception type, while the record's line shows just `sentinel`. The record's
own notes flag the same `exception.values[0].value === "sentinel"` observation, so this is a sink
formatting detail, not an SDK difference.
