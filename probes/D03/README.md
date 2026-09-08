# D03 - Request isolation under concurrency on Deno.serve

Runtime: Deno 2.9.0 | SDK: `@sentry/deno` 10.67.0 (develop line, tarballs in `_toolbox/pack/`),
hook active via `import "@sentry/deno/import"` as the first line of the entry

## What it reproduces

Two Deno apps serve the same route from two different server implementations: `main-serve.ts` uses
`Deno.serve`, `main-http.ts` uses `node:http` `createServer`. On `GET /a?tag=<t>` the handler writes
the tag onto the isolation scope with `Sentry.setTag("reqtag", t)` and onto the active server span
with `getActiveSpan().setAttribute("reqtag", t)`, sleeps a randomised 50-150 ms so the five in-flight
requests interleave inside each other, and then captures `Error("boom <t>")`. `drive.mjs` fires
`t1..t5` concurrently with `Promise.all`, then a `/sentinel?n=1` request whose message event is the
sink sentinel, and dumps the sink once the sentinel has arrived. `verify.mjs` checks the isolation
question the probe exists for: that each error event carries exactly one `reqtag` and it is its own,
that the event's `request.url` is its own request, that there is one `http.server` span per request
with the matching `url.full` and `reqtag` attribute, that all five trace ids are distinct, and that
every event's trace id equals its own request's server span trace id.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-deno-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz
```

`deno.json` sets `nodeModulesDir: "manual"`, so Deno uses exactly this `node_modules`.

## Run

From this directory (ports are free-choice; check they are unused first):

```
PORT=53311 node sink.mjs > sink.log 2>&1 & spid=$!
./run.sh serve 53312 53311 run1
./run.sh http  53313 53311 run1
kill $spid; wait $spid
```

`run.sh <serve|http> <app port> <sink port> <label>` starts the app with

```
APP_PORT=<app port> SINK_PORT=<sink port> \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-<mode>.ts
```

waits for it to answer, runs `node drive.mjs <app port> <sink port> > <mode>-result-<label>.json`,
renders it with `node verify.mjs <mode>-result-<label>.json`, and kills the app. `sink.mjs` is
`_toolbox/qs/sink.mjs` with the span mapping extended to keep each span's `op`, `trace_id`,
`parent_span_id`, `url.full` and its `reqtag` attribute instead of the default `"<op> <name>"`
string.

## Expected

Recorded verdict: **works**.

5 concurrent `GET /a?tag=t1..t5` requests each produce exactly one error event carrying only its own
`reqtag`, one `http.server` span per request with the matching `url.full` and `reqtag` attribute, 5
distinct trace ids, and each event's trace id equals its request's server span trace id. Same result
for the `Deno.serve` app and the `node:http` `createServer` app. Stream lifecycle: server spans
arrive as `span` envelopes named `GET` (no route), and events carry no `transaction` field on
`Deno.serve` while `node:http` events do.

Recorded evidence lines:

```
Deno.serve (develop/serve-result-run2.json via verify.mjs):
event "boom t1" tags={"reqtag":"t1"} trace=80e025c4108b484fa7aeff537a8534ee url=http://127.0.0.1:47212/a?tag=t1 OK
event "boom t2" tags={"reqtag":"t2"} trace=4434fee75b8a4b439e47ad02f6499840 url=http://127.0.0.1:47212/a?tag=t2 OK
event "boom t3" tags={"reqtag":"t3"} trace=214cd559d7224158bc830417c4b4a00c url=http://127.0.0.1:47212/a?tag=t3 OK
event "boom t4" tags={"reqtag":"t4"} trace=6101319eeda940ab9971643fb516ee57 url=http://127.0.0.1:47212/a?tag=t4 OK
event "boom t5" tags={"reqtag":"t5"} trace=237790ee132f42e1a722e60bbb182e4c url=http://127.0.0.1:47212/a?tag=t5 OK
server "GET" trace=80e025c4108b484fa7aeff537a8534ee url=http://127.0.0.1:47212/a?tag=t1 reqtag=t1
server "GET" trace=4434fee75b8a4b439e47ad02f6499840 url=http://127.0.0.1:47212/a?tag=t2 reqtag=t2
server "GET" trace=214cd559d7224158bc830417c4b4a00c url=http://127.0.0.1:47212/a?tag=t3 reqtag=t3
server "GET" trace=6101319eeda940ab9971643fb516ee57 url=http://127.0.0.1:47212/a?tag=t4 reqtag=t4
server "GET" trace=237790ee132f42e1a722e60bbb182e4c url=http://127.0.0.1:47212/a?tag=t5 reqtag=t5
summary: boomEvents=5 allTagsOwn=true serverSpansForA=5 distinctTraceIds=5 eventTraceIdsSubsetOfServer=true

node:http (develop/http-result-run2.json):
event "boom t1" tags={"reqtag":"t1"} trace=60e42f19eb194457a02e55de2d7cf0b2 url=http://127.0.0.1:47213/a?tag=t1 OK
event "boom t2" tags={"reqtag":"t2"} trace=ca0941b572e345158bdc62e71d38db69 url=http://127.0.0.1:47213/a?tag=t2 OK
event "boom t3" tags={"reqtag":"t3"} trace=ec81c1bc93ca4ad8a3e86b6ed5d10896 url=http://127.0.0.1:47213/a?tag=t3 OK
event "boom t4" tags={"reqtag":"t4"} trace=a47403b638ed451dbc81e9c39b7d0710 url=http://127.0.0.1:47213/a?tag=t4 OK
event "boom t5" tags={"reqtag":"t5"} trace=18d8a278acc046bcac63d98cf523490c url=http://127.0.0.1:47213/a?tag=t5 OK
server "GET" trace=60e42f19eb194457a02e55de2d7cf0b2 url=http://127.0.0.1:47213/a?tag=t1 reqtag=t1
server "GET" trace=ca0941b572e345158bdc62e71d38db69 url=http://127.0.0.1:47213/a?tag=t2 reqtag=t2
server "GET" trace=ec81c1bc93ca4ad8a3e86b6ed5d10896 url=http://127.0.0.1:47213/a?tag=t3 reqtag=t3
server "GET" trace=a47403b638ed451dbc81e9c39b7d0710 url=http://127.0.0.1:47213/a?tag=t4 reqtag=t4
server "GET" trace=18d8a278acc046bcac63d98cf523490c url=http://127.0.0.1:47213/a?tag=t5 reqtag=t5
summary: boomEvents=5 allTagsOwn=true serverSpansForA=5 distinctTraceIds=5 eventTraceIdsSubsetOfServer=true

Raw sink item shape (develop/serve-result-run2.json):
{"type":"span","items":[{"name":"GET","op":"http.server","trace_id":"80e025c4108b484fa7aeff537a8534ee","parent":null,"url":"http://127.0.0.1:47212/a?tag=t1","tagAttrs":{"reqtag":"t1"}}]}
```

## Observed on 2026-09-07

Matches the recorded verdict (**works**), on the first run, for both servers. Verbatim trimmed
output of the run above (`verify-serve-run1.txt`, `verify-http-run1.txt`, sink dumps in
`serve-result-run1.json` and `http-result-run1.json`):

```
Deno.serve (serve-result-run1.json via verify.mjs):
event "boom t1" tags={"reqtag":"t1"} trace=0a12c18606a54ca29e01d59d9b37c4e5 url=http://127.0.0.1:53312/a?tag=t1 transaction=<none> OK
event "boom t2" tags={"reqtag":"t2"} trace=eaf69fcef10347ec9f1e343e58e38f93 url=http://127.0.0.1:53312/a?tag=t2 transaction=<none> OK
event "boom t3" tags={"reqtag":"t3"} trace=f773b457b9284691b302992953530de6 url=http://127.0.0.1:53312/a?tag=t3 transaction=<none> OK
event "boom t4" tags={"reqtag":"t4"} trace=bb653660c3264157b0556f6c6f65793b url=http://127.0.0.1:53312/a?tag=t4 transaction=<none> OK
event "boom t5" tags={"reqtag":"t5"} trace=41a4e7b61c21465a84afe3eee26b461a url=http://127.0.0.1:53312/a?tag=t5 transaction=<none> OK
server "GET" trace=0a12c18606a54ca29e01d59d9b37c4e5 url=http://127.0.0.1:53312/a?tag=t1 reqtag=t1
server "GET" trace=eaf69fcef10347ec9f1e343e58e38f93 url=http://127.0.0.1:53312/a?tag=t2 reqtag=t2
server "GET" trace=f773b457b9284691b302992953530de6 url=http://127.0.0.1:53312/a?tag=t3 reqtag=t3
server "GET" trace=bb653660c3264157b0556f6c6f65793b url=http://127.0.0.1:53312/a?tag=t4 reqtag=t4
server "GET" trace=41a4e7b61c21465a84afe3eee26b461a url=http://127.0.0.1:53312/a?tag=t5 reqtag=t5
summary: boomEvents=5 allTagsOwn=true serverSpansForA=5 distinctTraceIds=5 eventTraceIdsSubsetOfServer=true

node:http (http-result-run1.json via verify.mjs):
event "boom t1" tags={"reqtag":"t1"} trace=da7db264df4c4e5d8287e5ddf3ac7e0b url=http://127.0.0.1:53313/a?tag=t1 transaction=GET /a OK
event "boom t2" tags={"reqtag":"t2"} trace=471559a08d0848bb82c09623bc386c9e url=http://127.0.0.1:53313/a?tag=t2 transaction=GET /a OK
event "boom t3" tags={"reqtag":"t3"} trace=f039b01b3c394bd8808d0230ce8d3a9b url=http://127.0.0.1:53313/a?tag=t3 transaction=GET /a OK
event "boom t4" tags={"reqtag":"t4"} trace=0f43b9b8cd9540cb857567676513a913 url=http://127.0.0.1:53313/a?tag=t4 transaction=GET /a OK
event "boom t5" tags={"reqtag":"t5"} trace=cc0b066ee9544ec1ba959bec95d48b68 url=http://127.0.0.1:53313/a?tag=t5 transaction=GET /a OK
server "GET" trace=da7db264df4c4e5d8287e5ddf3ac7e0b url=http://127.0.0.1:53313/a?tag=t1 reqtag=t1
server "GET" trace=471559a08d0848bb82c09623bc386c9e url=http://127.0.0.1:53313/a?tag=t2 reqtag=t2
server "GET" trace=f039b01b3c394bd8808d0230ce8d3a9b url=http://127.0.0.1:53313/a?tag=t3 reqtag=t3
server "GET" trace=0f43b9b8cd9540cb857567676513a913 url=http://127.0.0.1:53313/a?tag=t4 reqtag=t4
server "GET" trace=cc0b066ee9544ec1ba959bec95d48b68 url=http://127.0.0.1:53313/a?tag=t5 reqtag=t5
summary: boomEvents=5 allTagsOwn=true serverSpansForA=5 distinctTraceIds=5 eventTraceIdsSubsetOfServer=true

Raw sink item shape (serve-result-run1.json):
{"type":"span","items":[{"name":"GET","op":"http.server","trace_id":"0a12c18606a54ca29e01d59d9b37c4e5","parent":null,"url":"http://127.0.0.1:53312/a?tag=t1","status":"ok","is_segment":true,"tagAttrs":{"reqtag":"t1"}}]}

drive-serve-run1.log / drive-http-run1.log: responses: ["ok t1\n","ok t2\n","ok t3\n","ok t4\n","ok t5\n"]
```

Every recorded assertion holds: `boomEvents=5`, `allTagsOwn=true`, `serverSpansForA=5`,
`distinctTraceIds=5`, `eventTraceIdsSubsetOfServer=true` on both servers, no tag from one request on
another's event, and the server spans named `GET` with no route. The recorded secondary observation
holds too: on `Deno.serve` the error events carry no `transaction` field, while the `node:http`
events carry `transaction: "GET /a"`. Differences from the record are cosmetic: ports (53311-53313
instead of 47211-47213, because 47211 was already taken by another probe's sink on this machine),
the run's own trace ids, and the run label `run1` instead of `run2`. This rebuild also renders
`transaction=` in the `verify.mjs` event line and keeps `status` and `is_segment` in the sink's span
mapping, which the recorded run reported in prose rather than in the line, and it installs the SDK
from the `_toolbox/pack` tarballs instead of symlinking the worktree packages.

## Files

- `main-serve.ts` - the `Deno.serve` app
- `main-http.ts` - the `node:http` `createServer` app
- `deno.json` - `nodeModulesDir: "manual"`
- `sink.mjs` - envelope sink, span mapping extended for trace id, `url.full` and `reqtag`
- `drive.mjs` - 5 concurrent requests, sentinel, sink dump
- `verify.mjs` - renders the evidence lines and the summary
- `run.sh` - starts one app, drives it, verifies, kills it
- `serve-result-run1.json`, `http-result-run1.json` - sink dumps of the run above
- `verify-serve-run1.txt`, `verify-http-run1.txt` - the rendered evidence above
- `app-serve-run1.log`, `app-http-run1.log`, `drive-*-run1.log`, `sink.log` - process output
- `sink-run1.log` - note about a discarded first sink start that hit an occupied port
