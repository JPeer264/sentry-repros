# C05 — Queues producer and consumer locally (Cloudflare)

## What it reproduces

A plain `withSentry()` `ExportedHandler` on `@sentry/cloudflare` 10.67.0 (develop, v11 line) with a
Queue producer binding (`env.Q` -> queue `probe-q`) and a queue consumer in the same Worker, run under
`wrangler dev` with local queues. The `fetch` handler publishes messages with `env.Q.send()` and
`env.Q.sendBatch()`; the `queue(batch)` handler throws for one message body (`n === 99`), captures a
sentinel message for another (`n === 7`), and acks the rest. The probe shows that producer calls emit
`queue.publish` spans as children of the `http.server` segment, that queue invocations emit
`queue.process` segment spans with `messaging.*` attributes and a retry count, that a throw inside the
consumer is captured as an unhandled event with mechanism `auto.faas.cloudflare.queue`, and that
producer and consumer do not share a trace.

## Install

```
npm install \
  $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  wrangler@4
```

All five `@sentry/*` tarballs must be on one command line. Installing only
`sentry-cloudflare` + `sentry-core` pulls `@sentry/server-utils` from the npm registry, and the
registry build has no `./no-diagnostic-channels` export, so `wrangler dev` fails to bundle with
`Could not resolve "@sentry/server-utils/no-diagnostic-channels"`.

## Run

From this directory, in three steps (ports 41711 sink, 41721 Worker; the sink port is baked into
`wrangler.jsonc` as `vars.SENTRY_TUNNEL`):

```
PORT=41711 node sink.mjs > sink.log 2>&1 &
npx wrangler dev --port 41721 --inspector-port 0 > app.log 2>&1 &
# wait for 'Ready on http://localhost:41721' in app.log
node drive.mjs 41721 41711 > result.json
```

`drive.mjs` clears the sink, hits `/send`, `/send-bad` and `/send-sentinel` with 3s between them so
each publish lands in its own consumer batch, then waits for the `sentinel-queue` event to arrive
before dumping the sink. Kill both background pids when done.

## Expected

Recorded verdict: **works**.

Recorded evidence:

```
{"name": "send Q", "status": "ok", "trace_id": "97e6d54c138744f5b691d64fee8cf868", "parent_span_id": "bdec8794905f6a5b", "is_segment": false, "attributes": {"sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.publish", "messaging.system": "cloudflare", "messaging.destination.name": "Q", "messaging.operation.type": "send", "messaging.operation.name": "send", "messaging.message.body.size": 7, "sentry.segment.name": "GET", ...}}
{"name": "send Q", ... "attributes": {... "sentry.op": "queue.publish", "messaging.destination.name": "Q", "messaging.batch.message_count": 2, "messaging.message.body.size": 14, ...}}
{"name": "process probe-q", "status": "ok", "trace_id": "01bcbfa7c8ba4513a1a7be14f1a96032", "is_segment": true, "attributes": {"sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.process", "sentry.segment.name.source": "task", "faas.trigger": "pubsub", "messaging.destination.name": "probe-q", "messaging.system": "cloudflare", "messaging.operation.type": "process", "messaging.operation.name": "process", "messaging.batch.message_count": 3, "messaging.message.retry.count": 0, ...}}
{"type": "event", "exception": "consumer boom n=99 attempt=1", "mechanism": "auto.faas.cloudflare.queue", "handled": false, "trace": {"span_id": "afe03407f30b4f92", "trace_id": "e0941583ee50443a9d705684a542e5e8"}, "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}
{"name": "process probe-q", "status": "error", "trace_id": "e0941583ee50443a9d705684a542e5e8", "is_segment": true, "attributes": {"sentry.status.message": "internal_error", "sentry.op": "queue.process", ... "messaging.batch.message_count": 1, "messaging.message.retry.count": 0, ...}}
{"type": "event", "exception": "consumer boom n=99 attempt=2", "mechanism": "auto.faas.cloudflare.queue", "handled": false, "trace": {"trace_id": "524e0a5240c04addb2087a7d7a893fb9"}}
{"name": "process probe-q", "status": "error", "trace_id": "524e0a5240c04addb2087a7d7a893fb9", ... "messaging.batch.message_count": 1, "messaging.message.retry.count": 1, ...}
{"type": "event", "message": "sentinel-queue", ... "trace": {"trace_id": "5bcbea22721141428347bc9f68a814a6"}}
{"name": "process probe-q", "status": "ok", "trace_id": "5bcbea22721141428347bc9f68a814a6", ... "messaging.batch.message_count": 1, "messaging.message.retry.count": 0, ...}
```

Recorded findings: (1) the `queue.publish` span is named `send Q` after the env binding key, not
`send probe-q`. (2) No trace propagation from producer to consumer, each queue invocation gets its own
`trace_id`. (3) The consumer error is captured twice when workerd retries, retry count 0 then 1. (4)
`queue.process` spans have no children.

## Observed on 2026-09-07

wrangler 4.129.0, workerd 1.20260903.1, `@sentry/cloudflare` 10.67.0. Full dump in `result.json`.

```
{"name": "send Q", "status": "ok", "trace_id": "1c21228852a84398aad9607519326803", "parent_span_id": "a4308bd3f45eb8ad", "is_segment": false, "attributes": {"sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.publish", "messaging.system": "cloudflare", "messaging.destination.name": "Q", "messaging.operation.type": "send", "messaging.operation.name": "send", "messaging.message.body.size": 7, "sentry.segment.name": "GET", "sentry.segment.id": "a4308bd3f45eb8ad"}}
{"name": "send Q", "status": "ok", "trace_id": "1c21228852a84398aad9607519326803", "parent_span_id": "a4308bd3f45eb8ad", "is_segment": false, "attributes": {"sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.publish", "messaging.system": "cloudflare", "messaging.destination.name": "Q", "messaging.operation.type": "send", "messaging.operation.name": "send", "messaging.batch.message_count": 2, "messaging.message.body.size": 14, "sentry.segment.name": "GET", "sentry.segment.id": "a4308bd3f45eb8ad"}}
{"name": "process probe-q", "status": "ok", "trace_id": "332af19ecb464706b4182a05f6dea12c", "parent_span_id": null, "is_segment": true, "attributes": {"sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.process", "sentry.segment.name.source": "task", "faas.trigger": "pubsub", "messaging.destination.name": "probe-q", "messaging.system": "cloudflare", "messaging.operation.type": "process", "messaging.operation.name": "process", "messaging.batch.message_count": 3, "messaging.message.retry.count": 0, "sentry.segment.name": "process probe-q", "sentry.segment.id": "b9ce0fab176286ff"}}
{"type": "event", "exception": "consumer boom n=99 attempt=1", "mechanism": "auto.faas.cloudflare.queue", "handled": false, "trace": {"span_id": "8c12f0426ffef028", "trace_id": "71a4261cb6c24827a46a003031561c3d"}, "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}
{"name": "process probe-q", "status": "error", "trace_id": "71a4261cb6c24827a46a003031561c3d", "parent_span_id": null, "is_segment": true, "attributes": {"sentry.status.message": "internal_error", "sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.process", "sentry.segment.name.source": "task", "faas.trigger": "pubsub", "messaging.destination.name": "probe-q", "messaging.system": "cloudflare", "messaging.operation.type": "process", "messaging.operation.name": "process", "messaging.batch.message_count": 1, "messaging.message.retry.count": 0, "sentry.segment.name": "process probe-q", "sentry.segment.id": "8c12f0426ffef028"}}
{"type": "event", "exception": "consumer boom n=99 attempt=2", "mechanism": "auto.faas.cloudflare.queue", "handled": false, "trace": {"span_id": "800f676e85266659", "trace_id": "d4402c928f5d45788217a194ca9a3505"}, "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}
{"name": "process probe-q", "status": "error", "trace_id": "d4402c928f5d45788217a194ca9a3505", "parent_span_id": null, "is_segment": true, "attributes": {"sentry.status.message": "internal_error", "sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.process", "sentry.segment.name.source": "task", "faas.trigger": "pubsub", "messaging.destination.name": "probe-q", "messaging.system": "cloudflare", "messaging.operation.type": "process", "messaging.operation.name": "process", "messaging.batch.message_count": 1, "messaging.message.retry.count": 1, "sentry.segment.name": "process probe-q", "sentry.segment.id": "800f676e85266659"}}
{"type": "event", "message": "sentinel-queue", "mechanism": "generic", "handled": true, "trace": {"span_id": "9b54a5ed8bb8f075", "trace_id": "8cd69a3f18f447b28696692b138fa77d"}, "sdk": "sentry.javascript.cloudflare", "sdkVersion": "10.67.0"}
{"name": "process probe-q", "status": "ok", "trace_id": "8cd69a3f18f447b28696692b138fa77d", "parent_span_id": null, "is_segment": true, "attributes": {"sentry.origin": "auto.faas.cloudflare.queue", "sentry.op": "queue.process", "sentry.segment.name.source": "task", "faas.trigger": "pubsub", "messaging.destination.name": "probe-q", "messaging.system": "cloudflare", "messaging.operation.type": "process", "messaging.operation.name": "process", "messaging.batch.message_count": 1, "messaging.message.retry.count": 0, "sentry.segment.name": "process probe-q", "sentry.segment.id": "9b54a5ed8bb8f075"}}
```

Matches the recorded verdict `works`, line for line: same span names, same ops, same
`messaging.*` attributes and counts (batch of 3 for `/send`, `message_count: 2` and body size 14 on the
`sendBatch` publish span), same double capture of the consumer error with `retry.count` 0 then 1, same
`internal_error` status, and a distinct `trace_id` per queue invocation, so all four recorded findings
hold. The only deltas are non-behavioral: wrangler is 4.129.0 here (4.128.0 in the record), and the
install needs the `@sentry/server-utils` tarball explicitly, which is an install-side detail the
record's copied template already had.
