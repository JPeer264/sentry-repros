# B03 — Request isolation under concurrency on Bun.serve

Runtime: bun · SDK: `@sentry/bun` 10.67.0 (develop, v11 line, from `_toolbox/pack`)

## What it reproduces

Five concurrent `GET /a?tag=tN` requests are driven at a Bun server from a separate plain
`node` process. Each handler calls `Sentry.setTag('req', tN)`, awaits a timer so the five
handlers interleave, then captures `new Error('a')` and reads its own isolation-scope tags
back into the response body. The probe checks whether each error event carries exactly its
own tag (no leakage from a concurrent request), whether the five requests get five distinct
trace ids, and whether each error's trace id is covered by an `http.server` span envelope for
the same URL. Two servers are covered: `Bun.serve` (`app-serve.ts`) and `node:http`
`createServer` (`app-http.ts`, which on develop is instrumented by the default
`bunHttpServerIntegration`). The sink is a local copy of the toolbox sink extended to keep
trace ids, span ids, tags, request url and the `url.query` / `url.full` span attributes.

## Install

```
npm install --no-audit --no-fund \
  $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
```

## Run

```
cd $REPRO/probes/B03
bash run.sh app-serve.ts 53411 53412 serve
bash run.sh app-http.ts  53413 53414 http
```

`run.sh <app file> <sink port> <app port> <label>` starts the sink
(`PORT=<sink port> node sink.mjs`), starts the app (`SINK_PORT=<sink port> PORT=<app port> bun
<app file>`), runs `node drive.mjs <app port> <sink port> <label>` (five concurrent
`/a?tag=tN` fetches, then `/sentinel`, waiting for the sentinel event before reading the
sink), writes `drive-<label>.log` plus raw envelopes to `raw-<label>.log`, and kills both
processes. Pick free ports: another agent's sink may already hold 47311/47313. Pass a fifth
argument to use a different bun binary, e.g. a pinned 1.3.14 build.

## Expected (recorded verdict)

Verdict: **works**.

> Bun.serve: 5 concurrent GET /a?tag=tN requests each produced one error event carrying
> exactly its own tag ({req: tN}, no other keys), 5 distinct trace ids, and 5 http.server span
> envelopes (one per request, plus one for the sentinel) whose trace ids match the error
> events. node:http createServer (bunHttpServerIntegration, on by default in develop):
> identical result, 5 isolated error events with own tags, 5 http.server spans,
> event.transaction = 'GET /a'. Same outcome on Bun 1.4.0 and the CI pin 1.3.14.

Recorded evidence lines:

```
[Bun.serve, app-serve.ts]
responses: [{"tag":"t1","seen":{"req":"t1"}},{"tag":"t2","seen":{"req":"t2"}},{"tag":"t3","seen":{"req":"t3"}},{"tag":"t4","seen":{"req":"t4"}},{"tag":"t5","seen":{"req":"t5"}}]
{"type":"event","exception":"a","tags":{"req":"t5"},"trace_id":"1210c1effc654b35b8a4c76f41f65d1e","span_id":"ab19d88f19dacf70","request_url":"http://127.0.0.1:47312/a?tag=t5"}
{"type":"event","exception":"a","tags":{"req":"t1"},"trace_id":"7f8025aad2b147bb866006af78c2fa13","span_id":"b6ad2bf9e6db0017","request_url":"http://127.0.0.1:47312/a?tag=t1"}
{"type":"event","message":"sentinel","exception":"sentinel","tags":null,"trace_id":"ff7b529647f441ff90311d305224867e",...}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"7f8025aad2b147bb866006af78c2fa13","span_id":"b6ad2bf9e6db0017","parent":null,"query":"tag=t1","url":"http://127.0.0.1:47312/a?tag=t1"}]}
VERDICT errors: 5 tags: ["t1","t2","t3","t4","t5"] eachExactlyOwnTag: true
VERDICT http.server spans total: 6 distinct error trace ids: 5 server spans matching /a: 5
VERDICT server span trace ids cover error trace ids: true

[node:http createServer, app-http.ts]
responses: [{"tag":"t1","seen":{"req":"t1"}},{"tag":"t2","seen":{"req":"t2"}},{"tag":"t3","seen":{"req":"t3"}},{"tag":"t4","seen":{"req":"t4"}},{"tag":"t5","seen":{"req":"t5"}}]
{"type":"event","exception":"a","tags":{"req":"t1"},"trace_id":"1035e520e23b42b695e4abb74d42241b","span_id":"a67bc5f250387d76","request_url":"http://127.0.0.1:47314/a?tag=t1","transaction":"GET /a"}
```

## Observed on 2026-09-07

Bun 1.4.0, `@sentry/bun` 10.67.0 from the tarballs. Matches the recorded verdict.

`drive-serve.log` (Bun.serve):

```
[serve] responses: [{"tag":"t1","seen":{"req":"t1"}},{"tag":"t2","seen":{"req":"t2"}},{"tag":"t3","seen":{"req":"t3"}},{"tag":"t4","seen":{"req":"t4"}},{"tag":"t5","seen":{"req":"t5"}}]
{"type":"event","exception":"a","tags":{"req":"t1"},"trace_id":"e877dfa17f3747ed9298783f94a90950","span_id":"84784af0b525c634","request_url":"http://127.0.0.1:53412/a?tag=t1"}
{"type":"event","exception":"a","tags":{"req":"t2"},"trace_id":"265debf414db4eb78f800a128d5bb792","span_id":"ae5568ed34fb08bb","request_url":"http://127.0.0.1:53412/a?tag=t2"}
{"type":"event","exception":"a","tags":{"req":"t3"},"trace_id":"ba83221e3ec842c1a93983bf46fd6c42","span_id":"9699fd56ff090b90","request_url":"http://127.0.0.1:53412/a?tag=t3"}
{"type":"event","exception":"a","tags":{"req":"t4"},"trace_id":"75b13ef98c704e9bbfe2b0fd093d51a0","span_id":"b27ad3769bc2d080","request_url":"http://127.0.0.1:53412/a?tag=t4"}
{"type":"event","exception":"a","tags":{"req":"t5"},"trace_id":"6eef44c4edf54839a0b382a805f39161","span_id":"a1c21bcdd06bc181","request_url":"http://127.0.0.1:53412/a?tag=t5"}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"c676607428eb49c597f45924da9bac3d","span_id":"a4c5d0d89532d25e","parent":null,"url":"http://127.0.0.1:53412/ping"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"e877dfa17f3747ed9298783f94a90950","span_id":"84784af0b525c634","parent":null,"query":"tag=t1","url":"http://127.0.0.1:53412/a?tag=t1"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"265debf414db4eb78f800a128d5bb792","span_id":"ae5568ed34fb08bb","parent":null,"query":"tag=t2","url":"http://127.0.0.1:53412/a?tag=t2"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"ba83221e3ec842c1a93983bf46fd6c42","span_id":"9699fd56ff090b90","parent":null,"query":"tag=t3","url":"http://127.0.0.1:53412/a?tag=t3"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"75b13ef98c704e9bbfe2b0fd093d51a0","span_id":"b27ad3769bc2d080","parent":null,"query":"tag=t4","url":"http://127.0.0.1:53412/a?tag=t4"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"6eef44c4edf54839a0b382a805f39161","span_id":"a1c21bcdd06bc181","parent":null,"query":"tag=t5","url":"http://127.0.0.1:53412/a?tag=t5"}]}
{"type":"event","message":"sentinel","exception":"sentinel","tags":null,"trace_id":"a84fe330e4744aa18c15e107c0bc0e38","span_id":"bffc1e5503b21f72","request_url":"http://127.0.0.1:53412/sentinel"}
VERDICT errors: 5 tags: ["t1","t2","t3","t4","t5"] eachExactlyOwnTag: true
VERDICT http.server spans total: 6 distinct error trace ids: 5 server spans matching /a: 5
VERDICT server span trace ids cover error trace ids: true
```

`drive-http.log` (node:http createServer):

```
[http] responses: [{"tag":"t1","seen":{"req":"t1"}},{"tag":"t2","seen":{"req":"t2"}},{"tag":"t3","seen":{"req":"t3"}},{"tag":"t4","seen":{"req":"t4"}},{"tag":"t5","seen":{"req":"t5"}}]
{"type":"event","exception":"a","tags":{"req":"t1"},"trace_id":"6e03838170234dd6afaccfebe33dea55","span_id":"afcc8da6f36d2cc5","request_url":"http://127.0.0.1:53414/a?tag=t1","transaction":"GET /a"}
{"type":"event","exception":"a","tags":{"req":"t2"},"trace_id":"9b453c0eab684a3e87af68dc57583beb","span_id":"8a0208b108b525ca","request_url":"http://127.0.0.1:53414/a?tag=t2","transaction":"GET /a"}
{"type":"event","exception":"a","tags":{"req":"t4"},"trace_id":"227ababe3f0b450687968d0f3e5700ca","span_id":"b77b5411e3316f1f","request_url":"http://127.0.0.1:53414/a?tag=t4","transaction":"GET /a"}
{"type":"event","exception":"a","tags":{"req":"t3"},"trace_id":"785ccf56220b4669badc75692b338324","span_id":"b976a449327f59c6","request_url":"http://127.0.0.1:53414/a?tag=t3","transaction":"GET /a"}
{"type":"event","exception":"a","tags":{"req":"t5"},"trace_id":"994c96469feb4f6a882b30369fd0cccd","span_id":"9a218a6a265eb149","request_url":"http://127.0.0.1:53414/a?tag=t5","transaction":"GET /a"}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"b87def747bc341a8a5cc151ef46d1f81","span_id":"b5e8febc7bf8e537","parent":null,"url":"http://127.0.0.1:53414/ping"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"6e03838170234dd6afaccfebe33dea55","span_id":"afcc8da6f36d2cc5","parent":null,"query":"tag=t1","url":"http://127.0.0.1:53414/a?tag=t1"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"9b453c0eab684a3e87af68dc57583beb","span_id":"8a0208b108b525ca","parent":null,"query":"tag=t2","url":"http://127.0.0.1:53414/a?tag=t2"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"785ccf56220b4669badc75692b338324","span_id":"b976a449327f59c6","parent":null,"query":"tag=t3","url":"http://127.0.0.1:53414/a?tag=t3"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"227ababe3f0b450687968d0f3e5700ca","span_id":"b77b5411e3316f1f","parent":null,"query":"tag=t4","url":"http://127.0.0.1:53414/a?tag=t4"}]}
{"type":"span","items":[{"op":"http.server","name":"GET","trace_id":"994c96469feb4f6a882b30369fd0cccd","span_id":"9a218a6a265eb149","parent":null,"query":"tag=t5","url":"http://127.0.0.1:53414/a?tag=t5"}]}
{"type":"event","message":"sentinel","exception":"sentinel","tags":null,"trace_id":"388eb943b0634900824cff365caf4cd9","span_id":"90013dc8248d1e74","request_url":"http://127.0.0.1:53414/sentinel","transaction":"GET /sentinel"}
VERDICT errors: 5 tags: ["t1","t2","t3","t4","t5"] eachExactlyOwnTag: true
VERDICT http.server spans total: 6 distinct error trace ids: 5 server spans matching /a: 5
VERDICT server span trace ids cover error trace ids: true
```

Differences from the record, none of which change the verdict:

- The record's second server span envelope of the six was the sentinel request; here the six
  are the five `/a` spans plus the `/ping` readiness probe, because this rebuild answers
  `/ping` in a fast path and the sentinel span closed after the driver stopped polling. The
  five `/a` spans and their trace-id match are identical.
- Bun 1.3.14 was not re-run: the pinned binary the record used
  (`$SCRATCH/bun1314/bun-darwin-aarch64/bun`) no longer exists on this machine. Only Bun 1.4.0 was
  exercised.
- SDK packages come from the tarballs in `_toolbox/pack` rather than the worktree symlinks the
  original run used; both are the same 10.67.0 develop build.
