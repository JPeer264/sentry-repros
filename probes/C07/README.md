# C07 — R2 and KV locally (Cloudflare)

## What it reproduces

A minimal Cloudflare Worker wrapped in `Sentry.withSentry` from `@sentry/cloudflare` 10.67.0 (develop,
v11 line), running under plain `npx wrangler dev` with a local R2 bucket (`r2_buckets` binding
`BUCKET`) and a local KV namespace (`kv_namespaces` binding `KV`). `GET /r2` performs
`put/get/head/list/delete` on the bucket, `GET /kv` performs `put/get/list/delete` on the namespace, and
`GET /sentinel` captures a message that acts as the flush sentinel. The probe shows that R2 calls on
`env` are auto-instrumented (one child span per operation under the request segment, with
`cloudflare.r2.*` attributes) while KV calls produce no spans at all. It runs in both trace lifecycles:
the default `stream` (a `span` envelope whose segment is named `GET`) and `static`
(`--var TRACE_LIFECYCLE:static`, a `transaction` envelope with nested `spans[]`).

## Install

```
S=$SCRATCH
cd $REPRO/probes/C07
npm install $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
            $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz \
            $S/pack/sentry-opentelemetry-10.67.0.tgz wrangler@4
```

(The same tarballs are mirrored in `$REPRO/_toolbox/pack`.)
All five `@sentry/*` tarballs are required: with only `cloudflare` + `core`, npm pulls
`@sentry/server-utils` and `@sentry/opentelemetry` from the registry and the esbuild bundle fails with
`Could not resolve "@sentry/server-utils/no-diagnostic-channels"` and
`No matching export ... for import "SPAN_KIND"`.

## Run

```
cd $REPRO/probes/C07

# sink (port must match "SENTRY_TUNNEL" in wrangler.jsonc)
PORT=51703 node sink-c07.mjs > sink-run.log 2>&1 &

# stream lifecycle (default)
npx wrangler dev --port 51704 --inspector-port 0 > app-c.log 2>&1 &   # wait for "Ready on http://localhost:51704"
curl -s http://127.0.0.1:51704/r2; curl -s http://127.0.0.1:51704/kv; curl -s http://127.0.0.1:51704/sentinel
# poll until the sentinel event is present, then read the envelopes
curl -s http://127.0.0.1:51703/__items

# static lifecycle (restart the worker, clear the sink first)
curl -s -X DELETE http://127.0.0.1:51703/__items
npx wrangler dev --port 51704 --inspector-port 0 --var TRACE_LIFECYCLE:static > app-static.log 2>&1 &
curl -s http://127.0.0.1:51704/r2; curl -s http://127.0.0.1:51704/kv; curl -s http://127.0.0.1:51704/sentinel
curl -s http://127.0.0.1:51703/__items
```

`sink-c07.mjs` is `$S/qs/sink.mjs` with the span/transaction mapping widened to keep every span
attribute (the base sink only keeps `"<op> <name>"`).

## Expected

Recorded verdict: **works**.

With `r2_buckets BUCKET` and `kv_namespaces KV` in `wrangler.jsonc` and plain `npx wrangler dev`,
`BUCKET.put/get/head/list/delete` each produce one child span under the `http.server` segment: ops
`object.put/object.get/object.head/object.list/object.delete`, names
`r2_put/r2_get/r2_head/r2_list/r2_delete`, origin `auto.faas.cloudflare.r2`, attributes
`cloudflare.r2.operation` (`PutObject/GetObject/HeadObject/ListObjects/DeleteObject`),
`cloudflare.r2.bucket=BUCKET` (the binding name, not the `bucket_name` `probe`),
`cloudflare.r2.request.key=probe/k1` (list: `cloudflare.r2.request.prefix=probe/`).
`KV.put/get/list/delete` produce no spans at all: the `/kv` request yields only the `http.server`
segment span. Same result with `traceLifecycle: 'static'` (transaction `GET /r2` with the five nested
spans, `GET /kv` with `spans: []`).

Recorded evidence lines:

```
stream (default) run, items-b.jsonl:
{"type":"span","items":[{"op":"object.put","name":"r2_put","is_segment":false,"attrs":{"sentry.origin":"auto.faas.cloudflare.r2","sentry.op":"object.put","cloudflare.r2.operation":"PutObject","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.key":"probe/k1"}},{"op":"object.get","name":"r2_get",...},{"op":"object.head","name":"r2_head",...},{"op":"object.list","name":"r2_list","is_segment":false,"attrs":{...,"cloudflare.r2.operation":"ListObjects","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.prefix":"probe/"}},{"op":"object.delete","name":"r2_delete",...},{"op":"http.server","name":"GET","is_segment":true,"attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server"}}]}
{"type":"span","items":[{"op":"http.server","name":"GET","is_segment":true,...}]}   <- the /kv request: no KV spans
{"type":"event","message":"sentinel","sdk":"sentry.javascript.cloudflare","version":"10.67.0"}

static run (--var TRACE_LIFECYCLE:static), items-c-static.jsonl:
{"type":"transaction","name":"GET /r2","op":"http.server","source":"url","status":"ok","spans":[{"op":"object.put","description":"r2_put",...},{"op":"object.get","description":"r2_get",...},{"op":"object.head","description":"r2_head",...},{"op":"object.list","description":"r2_list",...},{"op":"object.delete","description":"r2_delete",...}]}
{"type":"transaction","name":"GET /kv","op":"http.server","source":"url","status":"ok","spans":[]}

HTTP responses: /r2 -> {"text":"hello r2","headSize":8,"listed":["probe/k1"]} ; /kv -> {"value":"hello kv","listed":["probe-k1"]}
```

## Observed on 2026-09-07

Matches. Full output in `items-b.jsonl` (stream) and `items-c-static.jsonl` (static).

HTTP responses, identical to the record:

```
/r2       -> {"text":"hello r2","headSize":8,"listed":["probe/k1"]}
/kv       -> {"value":"hello kv","listed":["probe-k1"]}
/sentinel -> sentinel
```

stream (default), `items-b.jsonl`, trimmed to op/name/is_segment and the R2 attributes:

```
{"type":"span","items":[{"op":"object.put","name":"r2_put","is_segment":false,"attrs":{"sentry.origin":"auto.faas.cloudflare.r2","sentry.op":"object.put","cloudflare.r2.operation":"PutObject","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.key":"probe/k1"}},{"op":"object.get","name":"r2_get","is_segment":false,"attrs":{"sentry.origin":"auto.faas.cloudflare.r2","sentry.op":"object.get","cloudflare.r2.operation":"GetObject","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.key":"probe/k1"}},{"op":"object.head","name":"r2_head","is_segment":false,"attrs":{"sentry.origin":"auto.faas.cloudflare.r2","sentry.op":"object.head","cloudflare.r2.operation":"HeadObject","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.key":"probe/k1"}},{"op":"object.list","name":"r2_list","is_segment":false,"attrs":{"sentry.origin":"auto.faas.cloudflare.r2","sentry.op":"object.list","cloudflare.r2.operation":"ListObjects","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.prefix":"probe/"}},{"op":"object.delete","name":"r2_delete","is_segment":false,"attrs":{"sentry.origin":"auto.faas.cloudflare.r2","sentry.op":"object.delete","cloudflare.r2.operation":"DeleteObject","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.key":"probe/k1"}},{"op":"http.server","name":"GET","is_segment":true,"attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","url.path":"/r2",...}}]}
{"type":"span","items":[{"op":"http.server","name":"GET","is_segment":true,"attrs":{"sentry.origin":"auto.http.cloudflare","sentry.op":"http.server","url.path":"/kv",...}}]}   <- the /kv request: no KV spans
{"type":"event","message":"sentinel","sdk":"sentry.javascript.cloudflare","runtime":"cloudflare"}
```

The segment spans additionally carry `"sentry.sdk.version":"10.67.0"` and
`"sentry.trace_lifecycle":"stream"`.

static (`--var TRACE_LIFECYCLE:static`), `items-c-static.jsonl`:

```
{"type":"transaction","name":"GET /r2","op":"http.server","source":"url","status":"ok","spans":[{"op":"object.put","description":"r2_put","origin":"auto.faas.cloudflare.r2","data":{"cloudflare.r2.operation":"PutObject","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.key":"probe/k1"}},{"op":"object.get","description":"r2_get",...},{"op":"object.head","description":"r2_head",...},{"op":"object.list","description":"r2_list","origin":"auto.faas.cloudflare.r2","data":{"cloudflare.r2.operation":"ListObjects","cloudflare.r2.bucket":"BUCKET","cloudflare.r2.request.prefix":"probe/"}},{"op":"object.delete","description":"r2_delete",...}]}
{"type":"transaction","name":"GET /kv","op":"http.server","source":"url","status":"ok","spans":[]}
```

Differences from the record: none in behavior. The only deviation is procedural — the install needs the
`@sentry/server-utils`, `@sentry/server-runtime-injection` and `@sentry/opentelemetry` tarballs on the
same `npm install` line (the record's command line only says "node_modules from `$S/pack` tarballs"),
and this rebuild uses ports 51703/51704 instead of the recorded 43117/43118.
