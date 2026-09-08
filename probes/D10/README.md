# D10 — Streaming responses on `Deno.serve`

Runtime: Deno 2.9.0. SDK: `@sentry/deno` 10.67.0 (develop tarballs from `_toolbox/pack`).

## What it reproduces

A `Deno.serve` app returns three chunked `ReadableStream` responses (`text/plain`, `text/event-stream`,
`application/octet-stream`, three chunks 300 ms apart) plus a `/sentinel` route, with
`traceLifecycle: 'static'`, `tracesSampleRate: 1.0` and `denoServeIntegration({ ignoreStatusCodes: [] })`
pointed at a local envelope sink. Two things go wrong. First, the `http.server` transaction only covers
the whole stream when the content-type matches the SDK's streaming heuristic
(`packages/deno/src/utils/streaming.ts`, `classifyResponseStreaming`): `text/plain` and
`text/event-stream` get a ~906 ms span, but `application/octet-stream` gets a 0 ms span even though the
client read for 900+ ms. Second, when the client cancels after the first chunk, the span does not end on
disconnect: `monitorStream` wraps the body in a `ReadableStream` with only a `start()` pump and no
`cancel()` hook, so the pump notices only when the *next* `controller.enqueue` throws, and it then calls
`reader.releaseLock()` rather than `reader.cancel()`. The span therefore ends one chunk late (605 ms with
300 ms chunks, 6004 ms with 3 s chunks) and always reports `status: ok` / HTTP 200 with no cancellation
marker, while the app's own `ReadableStream.cancel()` never runs, so the producer keeps its timer alive
and enqueues every remaining chunk. Without Sentry (`main-nosentry.ts`) Deno cancels the app stream with
reason `resource closed` a few ms after the client leaves.

## Install

```sh
cd $REPRO/probes/D10 && npm install
```

## Run

```sh
cd $REPRO/probes/D10

# envelope sink
PORT=41077 node sink.mjs > sink.log 2>&1 & sink=$!

# instrumented app (300 ms chunks)
SINK_PORT=41077 APP_PORT=41078 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app.log 2>&1 & app=$!

# full reads: content-type heuristic
curl -s -X DELETE http://127.0.0.1:41077/__items > /dev/null
node drive.mjs 41078 41077 /stream-plain full > runA-plain-full.log 2>&1
curl -s -X DELETE http://127.0.0.1:41077/__items > /dev/null
node drive.mjs 41078 41077 /stream-sse   full > runB-sse-full.log 2>&1
curl -s -X DELETE http://127.0.0.1:41077/__items > /dev/null
node drive.mjs 41078 41077 /stream-octet full > runC-octet-full.log 2>&1

# client cancels after the first chunk
curl -s -X DELETE http://127.0.0.1:41077/__items > /dev/null
SENTINEL_DELAY_MS=1500 node drive.mjs 41078 41077 /stream-plain cancel > runD-plain-cancel.log 2>&1
curl -s -X DELETE http://127.0.0.1:41077/__items > /dev/null
SENTINEL_DELAY_MS=1500 node drive.mjs 41078 41077 /stream-sse   cancel > runE-sse-cancel.log 2>&1

# slow chunks (3 s): the span is still open 1.5 s after the client left
CHUNK_MS=3000 SINK_PORT=41077 APP_PORT=41080 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-slow.ts > app-slow.log 2>&1 & slow=$!
curl -s -X DELETE http://127.0.0.1:41077/__items > /dev/null
SENTINEL_DELAY_MS=1500 POST_WAIT_MS=3000 node drive.mjs 41080 41077 /stream-sse cancel > runF-sse-slow-cancel.log 2>&1

# baseline without Sentry: Deno cancels the app stream on disconnect
APP_PORT=41079 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-nosentry.ts > app-nosentry.log 2>&1 & ns=$!
node drive.mjs 41079 41077 /stream-sse cancel > runG-nosentry-cancel.log 2>&1

kill $sink; kill $app; kill $slow; kill $ns
```

## Expected

Recorded verdict: **partial**.

Full read: the `http.server` transaction covers the whole stream (906 ms for `text/plain`, 909 ms for
`text/event-stream`, status ok) but only when the content-type matches the SDK's streaming heuristic;
`application/octet-stream` gets a 0 ms span. Client cancel after the first chunk: the span does NOT end
on disconnect, it ends only when the app enqueues the NEXT chunk into its stream (605 ms with 300 ms
chunks; 6007 ms with 3 s chunks, i.e. the span was still open 1.5 s after the client cancelled), always
with status ok / http 200 and no cancellation marker. The app's `ReadableStream` `cancel()` is never
invoked with Sentry active (without Sentry, Deno cancels it with reason `resource closed` 3 ms after the
client leaves), so the producer keeps running and enqueues all remaining chunks.

Recorded evidence lines:

```
runA-plain-full.log:
[drive 09:06:42.546] status=200 headers-received after 6ms
[drive 09:06:43.455] done after 914ms
{"type":"transaction","name":"GET /stream-plain","op":"http.server","source":"url","status":"ok","start_timestamp":1788512802.5440402,"timestamp":1788512803.4498863,"duration_ms":906,"http_status":200}

runB-sse-full.log:
{"type":"transaction","name":"GET /stream-sse","op":"http.server","status":"ok","start_timestamp":1788512803.5512118,"timestamp":1788512804.4597967,"duration_ms":909,"http_status":200}

runC-octet-full.log (client read all 3 chunks over 909ms):
{"type":"transaction","name":"GET /stream-octet","op":"http.server","status":"ok","start_timestamp":1788512804.599329,"timestamp":1788512804.5996168,"duration_ms":0,"http_status":200}

runE-sse-cancel.log (300ms chunks, client cancels after chunk-1):
[drive 09:06:47.859] got "chunk-1\n" after 308ms
[drive 09:06:47.859] cancelling after first chunk
{"type":"transaction","name":"GET /stream-sse","op":"http.server","status":"ok","start_timestamp":1788512807.552341,"timestamp":1788512808.1558642,"duration_ms":604,"http_status":200,"response_status_ctx":200}
app3.log for the same request (no UPSTREAM CANCELLED line, all chunks produced):
[app 09:06:47.552] GET /stream-sse
[app 09:06:47.854] sse: enqueued chunk-1
[app 09:06:48.155] sse: enqueued chunk-2
[app 09:06:48.457] sse: enqueued chunk-3
[app 09:06:48.458] sse: closed

runF-sse-slow-cancel.log (CHUNK_MS=3000, cancel after chunk-1 at 3.0s, sentinel at 4.5s):
[drive 09:07:37.434] got "chunk-1\n" after 3007ms
[drive 09:07:37.435] cancelling after first chunk
--- sink 3s later:
{"type":"transaction","received_at":1788512860437,"name":"GET /stream-sse","status":"ok","start_timestamp":1788512854.429865,"timestamp":1788512860.436836,"duration_ms":6007,"http_status":200}
app-slow.log:
[app 09:07:37.434] sse: enqueued chunk-1
[app 09:07:38.940] GET /sentinel
[app 09:07:40.436] sse: enqueued chunk-2

Baseline without Sentry (main-nosentry.ts), app-nosentry3.log:
[app 09:07:16.575] sse: enqueued chunk-1
[app 09:07:16.578] sse: UPSTREAM CANCELLED reason=resource closed
```

## Observed on 2026-09-07

Matches the recorded verdict on every point.

```
runA-plain-full.log:
[drive 09:32:14.381] status=200 headers-received after 23ms
[drive 09:32:15.287] got "chunk-3\n" after 929ms
[drive 09:32:15.287] done after 929ms
{"type":"transaction","received_at":1788773535288,"name":"GET /stream-plain","op":"http.server","source":"url","status":"ok","spans":[],"start_timestamp":1788773534.3766553,"timestamp":1788773535.281945,"duration_ms":905,"http_status":200,"response_status_ctx":200}

runB-sse-full.log:
[drive 09:32:16.283] done after 923ms
{"type":"transaction","received_at":1788773536283,"name":"GET /stream-sse","op":"http.server","source":"url","status":"ok","spans":[],"start_timestamp":1788773535.3768475,"timestamp":1788773536.282101,"duration_ms":905,"http_status":200,"response_status_ctx":200}

runC-octet-full.log (client read all 3 chunks over 922ms):
[drive 09:32:17.285] done after 922ms
{"type":"transaction","received_at":1788773536381,"name":"GET /stream-octet","op":"http.server","source":"url","status":"ok","spans":[],"start_timestamp":1788773536.3807054,"timestamp":1788773536.3809328,"duration_ms":0,"http_status":200,"response_status_ctx":200}

runE-sse-cancel.log (300ms chunks, client cancels after chunk-1):
[drive 09:32:26.312] got "chunk-1\n" after 320ms
[drive 09:32:26.313] cancelling after first chunk
{"type":"transaction","received_at":1788773546611,"name":"GET /stream-sse","op":"http.server","source":"url","status":"ok","spans":[],"start_timestamp":1788773546.0086904,"timestamp":1788773546.610383,"duration_ms":602,"http_status":200,"response_status_ctx":200}
app.log for the same request (no UPSTREAM CANCELLED line, all chunks produced):
[app 09:32:26.009] GET /stream-sse
[app 09:32:26.309] sse: enqueued chunk-1
[app 09:32:26.610] sse: enqueued chunk-2
[app 09:32:26.911] sse: enqueued chunk-3
[app 09:32:26.911] sse: closed

runF-sse-slow-cancel.log (CHUNK_MS=3000, cancel after chunk-1 at 3.0s, sentinel at 4.6s):
[drive 09:32:41.876] got "chunk-1\n" after 3023ms
[drive 09:32:41.876] cancelling after first chunk
[drive 09:32:43.493] sentinel sent at +4640ms; sink items:
{"type":"transaction","received_at":1788773563389,"name":"GET /sentinel","op":"http.server","status":"ok","duration_ms":4,"http_status":200}
{"type":"event","message":"sentinel",...}
--- sink 3s later:
{"type":"transaction","received_at":1788773564875,"name":"GET /stream-sse","op":"http.server","source":"url","status":"ok","spans":[],"start_timestamp":1788773558.8714793,"timestamp":1788773564.8750696,"duration_ms":6004,"http_status":200,"response_status_ctx":200}
app-slow.log:
[app 09:32:38.871] GET /stream-sse
[app 09:32:41.873] sse: enqueued chunk-1
[app 09:32:43.380] GET /sentinel
[app 09:32:44.874] sse: enqueued chunk-2

Baseline without Sentry (main-nosentry.ts), app-nosentry.log:
[app 09:32:56.186] GET /stream-sse
[app 09:32:56.492] sse: enqueued chunk-1
[app 09:32:56.495] sse: UPSTREAM CANCELLED reason=resource closed
```

Only cosmetic drift from the record: durations differ by a few milliseconds (905/905/0/602/6004 ms here
vs 906/909/0/604/6007 ms recorded), the baseline cancel arrives 3 ms after chunk-1 as recorded, and this
rebuild installs the SDK from the `_toolbox/pack` tarballs rather than worktree symlinks and uses ports
41077-41080 instead of 52817-52820. The `/sentinel` transaction lands in the sink before the cancelled
stream's transaction in run F, which is the record's point: the stream span is still open.
