# C09 — wrapRequestHandler without nodejs_compat

Runtime: Cloudflare Workers (wrangler dev / workerd). SDK: `develop` (v11 line, package version 10.67.0)
installed from the tarballs in `../../_toolbox/pack`.

## What it reproduces

`wrapRequestHandler` from `@sentry/cloudflare/request` is the entry point meant for runtimes that cannot
enable `nodejs_compat`. It boots fine with only `nodejs_als`, and with no compatibility flags at all: it
captures the thrown error, emits a request span, propagates `sentry-trace`/`baggage` on an outgoing
`fetch` (an `http.client` span parented to the request span, same trace id), and installs the base
integration set including `SpanStreaming`. The defect is that `/request` never installs the
AsyncLocalStorage async-context strategy, so the SDK runs on core's global stack strategy: a request that
does no I/O and captures nothing (`/hello`) is emitted as a legacy `transaction` envelope with an empty
`trace: {}` DSC instead of a `span` envelope, and in a `curl /hello` then `curl /sentinel` sequence the
sentinel event is dropped. `src/index-als.ts` is the control: calling
`setAsyncLocalStorageAsyncContextStrategy()` from `@sentry/server-utils/no-diagnostic-channels` at module
scope turns every request into a `span` envelope and puts the `http.client` child and its `http.server`
parent into a single envelope.

## Install

```
npm install --no-audit --no-fund
```

## Run

Three terminals, or background the first two. Ports: sink 41273, echo 41274, worker 41275 (41277 for the
ALS variant, 41278 for the no-flags variant).

```
cd $REPRO/probes/C09

PORT=41273 node sink.mjs > sink.log 2>&1 &
PORT=41274 node echo.mjs > echo.log 2>&1 &

# main variant, compatibility_flags ["nodejs_als"]
npx wrangler dev --port 41275 --inspector-port 0 > app.log 2>&1 &
node drive.mjs 41275 41273

# the dropped-sentinel sequence
curl -s -X DELETE http://127.0.0.1:41273/__items
curl -s http://127.0.0.1:41275/hello; curl -s http://127.0.0.1:41275/sentinel; sleep 4
curl -s http://127.0.0.1:41273/__items
curl -s 'http://127.0.0.1:41273/__items?raw'   # envelope headers, shows "trace":{}

# control: AsyncLocalStorage strategy set at module scope
npx wrangler dev --config wrangler-als.jsonc --port 41277 --inspector-port 0 > app-als.log 2>&1 &
node drive.mjs 41277 41273

# compatibility_flags []
npx wrangler dev --config wrangler-noflags.jsonc --port 41278 --inspector-port 0 > app-noflags.log 2>&1 &
node drive.mjs 41278 41273
```

`drive.mjs` clears the sink, hits `/hello`, `/error`, `/downstream`, `/integrations`, `/sentinel`, waits
for the sentinel event, then prints the sink. Stop every process you started with the pid you captured.

## Expected

Recorded verdict: **partial**.

`wrapRequestHandler` with only `nodejs_als` boots, captures the thrown error, emits a request span,
propagates `sentry-trace`/`baggage` on outgoing fetch and installs the base integration set including
`SpanStreaming`. Removing all compatibility flags gives the identical result. Defect: `/request` never
installs the AsyncLocalStorage context strategy, so the SDK runs on the stack strategy; `/hello` is
emitted as a legacy `transaction` envelope (empty `trace: {}`) instead of a `span` envelope, and in a
curl `/hello` then `/sentinel` sequence the sentinel event was dropped. Calling
`setAsyncLocalStorageAsyncContextStrategy()` at module scope fixes both.

Recorded evidence lines:

```
/downstream 200 {"url":"/users/7","sentry-trace":"3ad27397fe4a4a32b0742c573be10996-b0f1cadf32b9f78e-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=3ad27397fe4a4a32b0742c573be10996,sentry-org_id=1,sentry-sampled=true,sentry-sample_rand=0.4545969519644758,sentry-sample_rate=1"}
/integrations 200 {"integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"],"hasClient":true}
{"type":"transaction","name":"GET","op":"http.server","source":"url","status":"ok","spans":[]}   <- /hello
{"type":"span","items":["http.server GET"]}   <- /error
{"type":"event","exception":"route boom","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":{"name":"cloudflare"},"hasContextLine":false}
{"type":"span","items":["http.client GET 127.0.0.1"]}
{"type":"span","items":["http.server GET"]}   <- /downstream
{"type":"span","items":["http.server GET"]}   <- /integrations
{"type":"event","message":"sentinel",...}
{"type":"span","items":["http.server GET"]}   <- /sentinel

wrangler stack for /error: at AsyncContextStack.withScope (.../@sentry/core/src/asyncContext/stackStrategy.ts:50:28)

curl /hello then /sentinel:
{"type":"transaction","name":"GET","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET","op":"http.server","source":"url","status":"ok","spans":[]}
(no sentinel event, none after 4s; raw envelope header: "trace":{} and item {"type":"transaction"})

ALS variant: every request is a span envelope, child and parent share one envelope, sentinel delivered.
curl /hello,/sentinel on ALS variant: span, event sentinel, span.

compatibility_flags []: app boots, sink identical to the nodejs_als run. No `No such module` anywhere.
```

## Observed on 2026-09-07

Matches, with one difference in the ALS control (see the last block).

`node drive.mjs 41275 41273` (nodejs_als, `drive-cold2.log`):

```
/downstream 200 {"url":"/users/7","sentry-trace":"2472b0bf50c7464c9082184f5377ae1c-938089842bca245b-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=2472b0bf50c7464c9082184f5377ae1c,sentry-sampled=true,sentry-sample_rand=0.33595259127866184,sentry-sample_rate=1"}
/integrations 200 {"integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"],"hasClient":true}
--- sink ---
{"type":"transaction","name":"GET","op":"http.server","source":"url","status":"ok","trace_id":"3559e28ad7214a3b8b7a4cc183eb0bdf","sdk":"sentry.javascript.cloudflare","spans":[],"hasRequestData":false}
{"type":"span","trace_id":"058612c0626c431a8dfaf96aed77733d","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"event","exception":"Error: route boom","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"trace_id":"058612c0626c431a8dfaf96aed77733d","environment":"production"}
{"type":"span","trace_id":"2472b0bf50c7464c9082184f5377ae1c","items":["http.client GET 127.0.0.1"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"a0705e7dfe2532e4","is_segment":false,"origin":"auto.http.fetch"}]}
{"type":"span","trace_id":"2472b0bf50c7464c9082184f5377ae1c","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","trace_id":"e309d39cfa7d46699ae92922edf4b43a","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"trace_id":"e1e77221ff0e49cc8a90b02955b5284e","environment":"production"}
{"type":"span","trace_id":"e1e77221ff0e49cc8a90b02955b5284e","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
```

`app.log:82` confirms the stack strategy:

```
at AsyncContextStack.withScope (file://$REPRO/probes/C09/node_modules/@sentry/core/src/asyncContext/stackStrategy.ts:50:28)
```

curl `/hello` then `/sentinel` (`curl-hello-sentinel.log`) — two transaction envelopes with empty
`trace: {}`, no sentinel event:

```
{"type": "transaction", "name": "GET", "op": "http.server", "source": "url", "status": "ok", "trace_id": "283cfa542a6b4b67bcc9ff574b3e1ee5", "sdk": "sentry.javascript.cloudflare", "spans": [], "hasRequestData": false}
{"type": "transaction", "name": "GET", "op": "http.server", "source": "url", "status": "ok", "trace_id": "8bd5797a81e3454db3ed8e4a318d716f", "sdk": "sentry.javascript.cloudflare", "spans": [], "hasRequestData": false}
--- raw envelope headers ---
{"event_id": "4bb2b57a150d4c5f8fc809a22c92bf44", ..., "trace": {}} {"type": "transaction"}
{"event_id": "75504d395ef6497188bb82d5c0f89389", ..., "trace": {}} {"type": "transaction"}
```

`compatibility_flags []` (`drive-noflags.log`) — boots, no `No such module`, sink identical in shape to
the `nodejs_als` run (transaction for `/hello`, span envelopes for the rest, error event, sentinel):

```
/integrations 200 {"integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"],"hasClient":true}
--- sink ---
{"type":"transaction","name":"GET","op":"http.server","source":"url","status":"ok","trace_id":"a7261f799ea346ac80993387e5867fef","sdk":"sentry.javascript.cloudflare","spans":[],"hasRequestData":false}
{"type":"span","trace_id":"0df1a3ab1f2f419b972d58ab309aa2bf","items":["http.server GET"],...}
{"type":"event","exception":"Error: route boom","mechanism":"auto.http.cloudflare","handled":false,...}
{"type":"span","trace_id":"beadf5f0c7414b218675cd8a68e83d1e","items":["http.client GET 127.0.0.1"],...}
{"type":"span","trace_id":"beadf5f0c7414b218675cd8a68e83d1e","items":["http.server GET"],...}
{"type":"span","trace_id":"1c77d8a4c10a417e98db3f3d5c992e19","items":["http.server GET"],...}
{"type":"event","message":"sentinel",...}
{"type":"span","trace_id":"f4f5b334d1784cbda88e72298a012010","items":["http.server GET"],...}
```

ALS control (`als-drive.log`) — every request a span envelope, child and parent in one envelope, sentinel
delivered, and no `AsyncContextStack` in `app-als.log`:

```
{"type":"span","trace_id":"946338d1a98b464f8a5472cf1fa53c6a","items":["http.server GET"],...}
{"type":"event","exception":"Error: route boom","mechanism":"auto.http.cloudflare","handled":false,...}
{"type":"span","trace_id":"3d239ed2398d4308b44bb3460dc0de09","items":["http.server GET"],...}
{"type":"span","trace_id":"35fe5d6af56a4a49b4c027bdaec9acef","items":["http.client GET 127.0.0.1","http.server GET"],...}
{"type":"span","trace_id":"b42857cf5d924db88eab41d475edf4af","items":["http.server GET"],...}
{"type":"event","message":"sentinel",...}
{"type":"span","trace_id":"11c55d0db23c442e857afa9e0e50f819","items":["http.server GET"],...}
```

**Difference from the record**: the record says the ALS variant also delivers the sentinel in the bare
`curl /hello` then `curl /sentinel` sequence. Here it does not. Three runs (`als-curl.log`,
`als-curl2.log`, `als-curl3.log`, with 4 s, 8 s and 6 s waits, plus a `/sentinel`-only run) all produced
only span envelopes and no sentinel event:

```
{"type": "span", "trace_id": "c4ea6748f9a344749f7c71ef4eeb6d37", "items": ["http.server GET"], ...}
{"type": "span", "trace_id": "a253a89099d94c3e90dec9d81240d12b", "items": ["http.server GET"], ...}
```

The sentinel event does arrive on the ALS variant when it is driven by `drive.mjs` (five requests, warm
isolate), so the loss looks tied to a cold, curl-driven single request rather than to the context
strategy. The primary finding — `/hello` as a `transaction` envelope with empty `trace: {}` under
`/request` versus a `span` envelope with the ALS strategy set — reproduces exactly.
