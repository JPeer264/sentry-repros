# B10 — Streaming responses on Bun.serve

Runtime: bun 1.4.0 · SDK: `@sentry/bun` 10.67.0 (develop tarballs, `getsentry/sentry-javascript` @ `6f2da7483d`) · Recorded verdict: **broken**

## What it reproduces

A `Bun.serve` route that returns `new Response(readableStream)` gets an `http.server` transaction that ends the
moment the handler returns the `Response` object (0–3 ms), not when the stream actually finishes (~900 ms of
chunk production; the client measures ~920 ms for the full body). A client that aborts mid-stream is invisible
to the SDK: by the time the abort happens the transaction has already been sent with `status: "ok"` and
`http.response.status_code: 200`, and no error event is captured, even though Bun does invoke the stream's
`cancel()` callback and the next `controller.enqueue` throws. The root cause is in
`packages/bun/src/integrations/bunserver.ts` (~lines 249–275): the wrapper `startSpan`s around the handler and
only awaits `target.apply(...)`, i.e. the `Response` object, then sets the HTTP status from `response.status`.
It never observes the body `ReadableStream`, so the span cannot see stream completion, stream errors, or client
cancellation.

## Install

```
npm install $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
```

## Run

From this directory:

```
PORT=41875 node sink.mjs > sink.log 2>&1 & SP=$!
sleep 1
SINK_PORT=41875 PORT=41876 bun app.ts > app.log 2>&1 & AP=$!
sleep 2
node drive.mjs 41876 41875 > drive.log 2>&1
sleep 2          # let the cancelled stream's next enqueue fail before teardown
cat drive.log; cat app.log
kill $AP; wait $AP; kill $SP; wait $SP
```

`sink.mjs` is the shared envelope sink with the `transaction` mapping extended by `start_timestamp`,
`timestamp`, `duration_ms` and `http_status`. `drive.mjs` is a plain-node client (no Sentry in that process, so
no `sentry-trace` header leaks in and unsamples the server transaction); it reads `/stream` fully, aborts
`/stream-cancel` after the first chunk, then hits `/sentinel` and waits for the sentinel event in the sink
before printing the collected items. `instrument.ts` uses `traceLifecycle: 'static'` so transactions arrive as
`transaction` envelopes with start/end timestamps.

## Expected (recorded verdict and evidence)

Verdict: **broken**. The `http.server` transaction for a route returning `new Response(ReadableStream)` ends
when the handler returns the `Response` (1–3 ms), not when the stream finishes (~900 ms). Client cancel after
the first chunk is invisible: the transaction had already ended with `status: ok` /
`http.response.status_code: 200`, and no error event is captured. Identical on Bun 1.4.0 and CI-pinned 1.3.14.

Recorded evidence lines (Bun 1.4.0):

```
client: /stream full read took 915ms, body="stream chunk 1\nstream chunk 2\nstream chunk 3\n"
client: /stream-cancel first chunk after 306ms: "stream-cancel chunk 1\n"
client: read after abort -> AbortError
{"type":"transaction","name":"GET /stream","op":"http.server","source":"route","status":"ok","start_timestamp":1788512350.2819178,"timestamp":1788512350.2839537,"duration_ms":2,"http_status":200, ... "spans":[]}
{"type":"transaction","name":"GET /stream-cancel","op":"http.server","source":"route","status":"ok","start_timestamp":1788512351.1945372,"timestamp":1788512351.1948693,"duration_ms":0,"http_status":200, ... "spans":[]}
{"type":"event","message":"sentinel",...}
(no event for the cancelled stream)

stream: handler returned Response at 1788512350282
stream: enqueued chunk 1 at 1788512350584
stream: enqueued chunk 2 at 1788512350888
stream: enqueued chunk 3 at 1788512351190
stream: closed at 1788512351190
stream-cancel: handler returned Response at 1788512351194
stream-cancel: enqueued chunk 1 at 1788512351496
stream-cancel: stream cancelled: undefined
stream-cancel: enqueue failed at chunk 2: TypeError [ERR_INVALID_STATE]: Invalid state: Controller is already closed
```

Recorded on Bun 1.3.14 (`drive-1314.log`):

```
{"name":"GET /stream","status":"ok","start_timestamp":1788512383.1179712,"timestamp":1788512383.119092,"duration_ms":1,"http_status":200}
{"name":"GET /stream-cancel","status":"ok","start_timestamp":1788512384.0351622,"timestamp":1788512384.0357344,"duration_ms":1,"http_status":200}
```

## Observed on 2026-09-07

Matches. `drive.log`:

```
client: /stream full read took 921ms, body="stream chunk 1\nstream chunk 2\nstream chunk 3\n"
client: /stream-cancel first chunk after 303ms: "stream-cancel chunk 1\n"
client: read after abort -> AbortError
{"type":"transaction","name":"GET /stream","op":"http.server","source":"route","status":"ok","trace_id":"9ba023659158471baea45f43d85ae6ad","sdk":"sentry.javascript.bun","start_timestamp":1788771076.479002,"timestamp":1788771076.4797041,"duration_ms":1,"http_status":200,"spans":[],"hasRequestData":false}
{"type":"transaction","name":"GET /stream-cancel","op":"http.server","source":"route","status":"ok","trace_id":"6b27c20c9f7f455a9a9a36ce27b49ce3","sdk":"sentry.javascript.bun","start_timestamp":1788771077.383622,"timestamp":1788771077.3838637,"duration_ms":0,"http_status":200,"spans":[],"hasRequestData":false}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.bun","runtime":"bun",...}
```

No event for the cancelled stream. `app.log`:

```
stream: handler returned Response at 1788771076479
stream: enqueued chunk 1 at 1788771076780
stream: enqueued chunk 2 at 1788771077080
stream: enqueued chunk 3 at 1788771077381
stream: closed at 1788771077381
stream-cancel: handler returned Response at 1788771077383
stream-cancel: enqueued chunk 1 at 1788771077684
stream-cancel: stream cancelled: undefined
stream-cancel: enqueue failed at chunk 2: TypeError [ERR_INVALID_STATE]: Invalid state: Controller is already closed
```

Transaction end `1788771076.4797` == handler-return time `1788771076479` ms; the stream closed 902 ms later at
`1788771077381`. `/stream-cancel` reports `duration_ms: 0`, `status: ok`, `http_status: 200`.

One difference from the record, environmental only: the CI-pinned Bun 1.3.14 build
(`$SCRATCH/bun1314/bun-darwin-aarch64/bun`) no longer exists on this machine, so the 1.3.14 repeat is **not-run**.
The Bun 1.4.0 numbers reproduce the record within normal timing jitter.

## Files

- `instrument.ts` — `Sentry.init` with `traceLifecycle: 'static'` and `tunnel` pointed at the sink
- `app.ts` — `Bun.serve` with `routes: {}` for `/stream`, `/stream-cancel`, `/sentinel`
- `drive.mjs` — plain-node client + sentinel wait + sink dump
- `sink.mjs` — envelope sink, transaction mapping extended with timestamps and HTTP status
