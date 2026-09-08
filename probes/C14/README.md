# C14 - Streaming responses and work after the response on Workers

Runtime: Cloudflare Workers (`wrangler dev` 4.x / workerd 1.20260903.1) | SDK: `@sentry/cloudflare`
10.67.0 (develop line, tarballs in `_toolbox/pack/`)

## What it reproduces

A Worker wrapped in `withSentry` (`tracesSampleRate: 1`, `tunnel` built from the `SINK_PORT` var,
`traceLifecycle` switched by the `TRACE_LIFECYCLE` var, `debug` by `SENTRY_DEBUG`) exposes three
routes. `/stream` answers with a `ReadableStream` that enqueues three chunks 300 ms apart, each
carrying its own `Date.now()`, so the response headers are sent immediately while the body keeps
running for ~600 ms. `/after` answers immediately and hands `ctx.waitUntil` a
`Sentry.startSpan({ name: 'after' }, ...)` that sleeps 500 ms, i.e. work that finishes only after
the response is done. `/sentinel?m=<unique>` captures a message used to prove the sink has caught
up. The probe asks two things: whether the request span covers the whole streamed body rather than
ending at the headers, and whether a span created in `ctx.waitUntil` after the response still
reaches Sentry, under the default `stream` lifecycle and under `traceLifecycle: 'static'`.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  wrangler@4
```

## Run

From this directory (ports 47141 sink / 47142 app; pick free ones if these are taken):

```
PORT=47141 node sink.mjs > sink.log 2>&1 & spid=$!

# stream (default) lifecycle
npx wrangler dev --port 47142 --inspector-port 0 --var SINK_PORT:47141 > app-stream.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:47142" app-stream.log && break; sleep 1; done
bash drive.sh 47141 47142 2>&1 | tee run-stream.txt
kill $apid

# static lifecycle
npx wrangler dev --port 47142 --inspector-port 0 --var SINK_PORT:47141 --var TRACE_LIFECYCLE:static > app-static.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:47142" app-static.log && break; sleep 1; done
bash drive.sh 47141 47142 2>&1 | tee run-static.txt
kill $apid

# static lifecycle + SDK debug log
npx wrangler dev --port 47142 --inspector-port 0 --var SINK_PORT:47141 --var TRACE_LIFECYCLE:static --var SENTRY_DEBUG:1 > app-static-debug.log 2>&1 & apid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:47142" app-static-debug.log && break; sleep 1; done
curl -s -X DELETE http://127.0.0.1:47141/__items > /dev/null
curl -s http://127.0.0.1:47142/after; sleep 2; sed -n '35,50p' app-static-debug.log
curl -s http://127.0.0.1:47141/__items
kill $apid; kill $spid
```

`drive.sh <sink-port> <app-port>` clears the sink, curls `/stream` unbuffered (`-N`) printing the
chunks and curl's ttfb/total, curls `/after`, sleeps 1 s (the "after" span only ends 500 ms after
the response, so an immediate sentinel would give a false negative), curls `/sentinel` with a
`sentinel-$RANDOM` message (a repeated identical message is dropped by Dedupe, because
`wrangler dev` reuses the isolate), polls until that message is in the sink, prints every item, and
after 3 more seconds prints the final item count. `sink.mjs` is `_toolbox/qs/sink.mjs` with an
`arrived` wall-clock timestamp on every item and start/end/duration, `span_id`, `parent`,
`is_segment` and `http.response.status_code` kept for spans and transactions.

## Expected

Recorded verdict: **works**.

Default (stream) lifecycle: the request span for `/stream` covers the whole stream (604-631 ms, end
timestamp equal to the third chunk's timestamp), and the "after" span from
`ctx.waitUntil(Sentry.startSpan(...))` arrives ~500 ms after the response as its own span envelope,
non-segment, with the request span as parent and the same trace id. With `traceLifecycle: 'static'`
the request transactions still cover the stream (`GET /stream`, 604 ms) but the "after" span is lost
entirely: the `GET /after` transaction is sent 1 ms after the response with `spans: []`, no follow-up
envelope ever arrives (checked 3 s after a unique sentinel), and the debug log shows the child span
finishing after the root span had already been sent.

Recorded evidence lines:

```
STREAM lifecycle (drive.sh output, run-stream.txt):
--- /stream  t_start=1788510383.289
chunk-1 1788510383307 / chunk-2 1788510383609 / chunk-3 1788510383938  [curl ttfb=0.009390s total=0.641241s]
--- /after   t_start=1788510384.014  immediate 1788510384028  [curl ttfb=0.002083s total=0.003481s]
span envelope arrived=1788510383.946
  {"name":"GET","op":"http.server","segment":true,"trace_id":"e7c8c9ed02504e06856559580bfdbf4b","span_id":"ab25a37ef053835f","start":"1788510383.307","end":"1788510383.938","duration_ms":631,"status":"ok","http_status":200}
span envelope arrived=1788510384.031
  {"name":"GET","op":"http.server","segment":true,"trace_id":"ecb27772f56d4251919fcde2a89d7134","span_id":"8c84ba2daf227945","start":"1788510384.028","end":"1788510384.029","duration_ms":1,"status":"ok","http_status":200}
span envelope arrived=1788510384.531
  {"name":"after","segment":false,"trace_id":"ecb27772f56d4251919fcde2a89d7134","span_id":"a50e099c42fa8dba","parent":"8c84ba2daf227945","start":"1788510384.028","end":"1788510384.530","duration_ms":502,"status":"ok"}
{"type":"event","arrived":"1788510385.128","message":"sentinel-24116",...}
--- item count after 3 more seconds: 5

STATIC lifecycle (run-static.txt):
transaction {"type":"transaction","arrived":"1788510400.951","name":"GET /stream","op":"http.server","source":"url","status":"ok","trace_id":"f86cabd7c1834816852d1cec848e4f2d","span_id":"9cf7539af1334a84","start":"1788510400.341","end":"1788510400.945","duration_ms":604}
transaction {"type":"transaction","arrived":"1788510401.038","name":"GET /after","op":"http.server","source":"url","status":"ok","trace_id":"d926dfcf27b943ba8631532d6d36ca1b","span_id":"8f2e6d876113ea44","start":"1788510401.034","end":"1788510401.035","duration_ms":1}   (spans: [])
{"type":"event","arrived":"1788510402.141","message":"sentinel-11802",...}
transaction {... "name":"GET /sentinel" ...}
--- item count after 3 more seconds: 4   (no envelope carrying the "after" span)

STATIC + debug (app-static-debug.log):
Sentry Logger [log]: [Tracing] Starting sampled span
  op: < unknown op >
  name: after
  ID: 878e2b4473c9fe21
  parent ID: 9d634fa1581de6e7
Sentry Logger [log]: [Tracing] Finishing "http.server" root span "GET /after" with ID 9d634fa1581de6e7
[wrangler:info] GET /after 200 OK (10ms)
Sentry Logger [log]: [Tracing] Finishing "< unknown op >" span "after" with ID 878e2b4473c9fe21
sink: transaction GET /after span_id 9d634fa1581de6e7 duration_ms 3, "spans":[]
```

## Observed on 2026-09-07

Matches the recorded verdict (**works**), item for item. Verbatim output of the three runs above
(`run-stream.txt`, `run-static.txt`, `app-static-debug.log` in this directory):

```
run-stream.txt:
--- /stream  t_start=1788771572.903
chunk-1 1788771572917
chunk-2 1788771573218
chunk-3 1788771573520
[curl ttfb=0.008423s total=0.617489s]
--- /after   t_start=1788771573.936
immediate 1788771573950
[curl ttfb=0.002698s total=0.004685s]
span envelope arrived=1788771573.535
  {"name": "GET", "op": "http.server", "segment": true, "trace_id": "e81c7707f4fc48558e5816d3742e9df0", "span_id": "bedb3f8bdc435aef", "start": "1788771572.917", "end": "1788771573.520", "duration_ms": 603, "status": "ok", "http_status": 200}
span envelope arrived=1788771573.954
  {"name": "GET", "op": "http.server", "segment": true, "trace_id": "a6e1d24e80b24a2b90416a675c6b69a3", "span_id": "9e1a41ece9896fcb", "start": "1788771573.950", "end": "1788771573.950", "duration_ms": 0, "status": "ok", "http_status": 200}
span envelope arrived=1788771574.454
  {"name": "after", "segment": false, "trace_id": "a6e1d24e80b24a2b90416a675c6b69a3", "span_id": "acf8dd0c69728663", "parent": "9e1a41ece9896fcb", "start": "1788771573.950", "end": "1788771574.451", "duration_ms": 501, "status": "ok"}
{"type": "event", "arrived": "1788771574.985", "message": "sentinel-31963", ...}
span envelope arrived=1788771574.986
  {"name": "GET", "op": "http.server", "segment": true, "trace_id": "21ecd646003a437a9cd25a7b33a4fa4c", "span_id": "bde2503ed5f0e7c0", "start": "1788771574.979", "end": "1788771574.983", "duration_ms": 4, "status": "ok", "http_status": 200}
--- item count after 3 more seconds: 5

run-static.txt:
--- /stream  t_start=1788771600.604
chunk-1 1788771600619
chunk-2 1788771600920
chunk-3 1788771601221
[curl ttfb=0.007896s total=0.610431s]
--- /after   t_start=1788771601.498
immediate 1788771601509
[curl ttfb=0.002023s total=0.003624s]
transaction {"type": "transaction", "arrived": "1788771601.226", "name": "GET /stream", "op": "http.server", "source": "url", "status": "ok", "trace_id": "34a2bd64c09a4984b86c670593639550", "span_id": "9e4098ebf1081dbb", "start": "1788771600.618", "end": "1788771601.221", "duration_ms": 603, "spans": [], "sdk": "sentry.javascript.cloudflare"}
transaction {"type": "transaction", "arrived": "1788771601.512", "name": "GET /after", "op": "http.server", "source": "url", "status": "ok", "trace_id": "7d96f813ced94ed8b46d99177825d9cd", "span_id": "a975e1001d69fb20", "start": "1788771601.508", "end": "1788771601.509", "duration_ms": 1, "spans": [], "sdk": "sentry.javascript.cloudflare"}
{"type": "event", "arrived": "1788771602.585", "message": "sentinel-15881", ...}
transaction {"type": "transaction", "arrived": "1788771602.585", "name": "GET /sentinel", "op": "http.server", "source": "url", "status": "ok", "trace_id": "961abef3815f441896cfa5fe5e21f18e", "span_id": "b0d2c49f72b97210", "start": "1788771602.564", "end": "1788771602.582", "duration_ms": 18, "spans": [], "sdk": "sentry.javascript.cloudflare"}
--- item count after 3 more seconds: 4

app-static-debug.log (lines 35-50) plus the sink after a single GET /after:
Sentry Logger [log]: [Tracing] Starting sampled root span
  op: http.server
  name: GET /after
  ID: 95f2ee56503a1ad2
Sentry Logger [log]: [Tracing] Starting sampled span
  op: < unknown op >
  name: after
  ID: b241beec43a541c9
  parent ID: 95f2ee56503a1ad2
  root ID: 95f2ee56503a1ad2
  root op: http.server
  root description: GET /after
Sentry Logger [log]: [Tracing] Finishing "http.server" root span "GET /after" with ID 95f2ee56503a1ad2
[wrangler:info] GET /after 200 OK (10ms)
Sentry Logger [log]: [Tracing] Finishing "< unknown op >" span "after" with ID b241beec43a541c9
sink: {"type": "transaction", "arrived": "1788771624.720", "name": "GET /after", ..., "span_id": "95f2ee56503a1ad2", "start": "1788771624.710", "end": "1788771624.713", "duration_ms": 3, "spans": []}
```

Both halves reproduce. In stream mode the `/stream` request span ends at `1788771573.520`, the exact
timestamp the third chunk carries (`chunk-3 1788771573520`), 603 ms after its start, while curl's
ttfb was 8 ms, so the span is ended when the body stream closes and not when the headers go out; the
"after" span arrives 500 ms after the response as a separate, non-segment envelope with
`parent` = the request span's `span_id` and the same trace id. In static mode the `GET /stream`
transaction covers the same 603 ms, but `GET /after` is sent 4 ms after the response with
`spans: []` and nothing else ever arrives (4 items total, counted 3 s after a unique sentinel that
was sent 1 s after `/after` and did arrive). The debug run shows the same silent loss: the root span
is finished and sent before the child span `after` finishes, and no SDK line reports the discard.
Differences from the record are cosmetic: ports (47141/47142 instead of 41477/41478), the run's own
trace/span ids and wall-clock timestamps, durations 603/501/0 ms instead of 604/502/1 ms, and this
sink also fills an `exception` field for `captureMessage` events (attached stack trace), which the
record's sink did not print.

## Files

- `src/index.ts` - the Worker (`/stream`, `/after`, `/sentinel`)
- `wrangler.jsonc` - `compatibility_date: 2026-05-01`, `compatibility_flags: ["nodejs_compat"]`
- `sink.mjs` - envelope sink with arrival and span timestamps
- `drive.sh` - request driver, unique sentinel, item dump
- `run-stream.txt`, `run-static.txt`, `app-stream.log`, `app-static.log`, `app-static-debug.log`,
  `sink.log` - output of the runs above
