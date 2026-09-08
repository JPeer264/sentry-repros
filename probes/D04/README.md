# D04 — Incoming trace continuation on `Deno.serve` and `node:http` (runtime: deno)

## What it reproduces

A single Deno process runs `@sentry/deno` (develop, 10.67.0, no `@sentry/deno/import` hook) with two
servers: a `Deno.serve` listener and a `node:http` listener. A plain `curl` sends `sentry-trace` and
`baggage` for an upstream trace (`aaaa…ab-bbbbbbbbbbbbbbbb-1`, environment `upstreamenv`, transaction
`upstream-tx`) to `/probe` on both. Each handler makes two outgoing calls to a header-recording server,
one with `fetch` and one with `node:http`, and reports its active span. The probe shows whether the
incoming trace is continued on both server types, whether the frozen DSC in the envelope header comes
from the upstream baggage, and whether outgoing `fetch` and outgoing `node:http` propagate the trace.
It runs once with the default `traceLifecycle: 'stream'` and once with `'static'`.

## Install

```
cd $REPRO/probes/D04 && npm install
```

## Run

`run.sh` starts the envelope sink (`sink.mjs`), the downstream header recorder (`recorder.mjs`) and the
Deno app, drives them, prints the recorder and sink contents, and kills all three.

```
cd $REPRO/probes/D04
# usage: ./run.sh <sinkPort> <appPort(Deno.serve)> <httpPort(node:http)> <recorderPort> [stream|static]
./run.sh 51341 51342 51343 51344         > out-develop-stream.txt 2>&1   # default lifecycle: stream
./run.sh 51351 51352 51353 51354 static  > out-develop-static.txt  2>&1
```

Pick ports that are free (`lsof -nP -iTCP:<port> -sTCP:LISTEN`); other agents may hold ports in the
47xxx range. The sink alone can be started with `PORT=<port> node sink.mjs`.

The request `run.sh` sends to each server:

```
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1" \
        -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-environment=upstreamenv,sentry-transaction=upstream-tx" \
        http://127.0.0.1:<port>/probe
```

## Expected

Recorded verdict: **partial**.

Incoming `sentry-trace`/`baggage` are continued on both `Deno.serve` and `node:http` servers (server
span `trace_id` = `aaaa…ab`, `parent_span_id` = `bbbbbbbbbbbbbbbb`, DSC in the envelope header carries
the upstream baggage values). An outgoing `node:http` request from inside the handler carries
`sentry-trace` (same trace, parent = the server span) and the upstream baggage. An outgoing `fetch`
from inside the same handler carries no `sentry-trace`, no `baggage`, no `traceparent`, and gets no
`http.client` span (known finding K2 confirmed, even inside an active continued trace). Identical with
default `traceLifecycle: 'stream'` (span envelopes) and with `'static'` (transaction envelopes).

Recorded evidence, stream run, recorder:

```
{"path":"/denoserve/via-fetch","sentry-trace":null,"baggage":null,"traceparent":null}
{"path":"/denoserve/via-http","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-815cc88f8629b05f-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-environment=upstreamenv,sentry-transaction=upstream-tx,sentry-sample_rand=0.9959810673450149","traceparent":null}
{"path":"/nodehttp/via-fetch","sentry-trace":null,"baggage":null,"traceparent":null}
{"path":"/nodehttp/via-http","sentry-trace":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-846643b5cd060408-1","baggage":"sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-environment=upstreamenv,sentry-transaction=upstream-tx,sentry-sample_rand=0.9425065115451472","traceparent":null}
```

Recorded evidence, stream run, sink (one span envelope holding both servers' segments):

```
{"type":"span","dsc":{"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","public_key":"public","sample_rate":"1","sampled":"true","environment":"upstreamenv","transaction":"upstream-tx","sample_rand":"0.9959810673450149"},"items":[{"op":"http.client","name":"GET 127.0.0.1","origin":"auto.http.client","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"815cc88f8629b05f","parent_span_id":"b9469813e9db9c87","is_segment":false},{"op":"http.server","name":"GET","origin":"auto.http.deno","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"b9469813e9db9c87","parent_span_id":"bbbbbbbbbbbbbbbb","is_segment":true},{"op":"http.client","name":"GET 127.0.0.1","origin":"auto.http.client","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"846643b5cd060408","parent_span_id":"8f5a5f2e1e1175b8","is_segment":false},{"op":"http.server","name":"GET","origin":"auto.http.server","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"8f5a5f2e1e1175b8","parent_span_id":"bbbbbbbbbbbbbbbb","is_segment":true}]}
handler-side Sentry.getActiveSpan() during the Deno.serve request: {"tag":"denoserve","active":{"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"b9469813e9db9c87","parent_span_id":"bbbbbbbbbbbbbbbb"}}
```

Recorded evidence, static run, sink:

```
{"type":"transaction","name":"GET /probe","op":"http.server","source":"url","status":"ok","origin":"auto.http.deno","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"afed6674c4fcc2f8","parent_span_id":"bbbbbbbbbbbbbbbb","dsc":{..."environment":"upstreamenv","transaction":"upstream-tx"...},"spans":[{"op":"http.client","description":"GET http://127.0.0.1:47223/denoserve/via-http","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"bbfa5e60104159ca","parent_span_id":"afed6674c4fcc2f8"}]}
{"type":"transaction","name":"GET /probe","op":"http.server","source":"url","status":"ok","origin":"auto.http.server","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"9fb9487e579bca4f","parent_span_id":"bbbbbbbbbbbbbbbb",..."spans":[{"op":"http.client","description":"GET http://127.0.0.1...
```

## Observed on 2026-09-07

Matches the recorded verdict (**partial**), on both lifecycles. Deno 2.9.0, `@sentry/deno` 10.67.0 from
`_toolbox/pack`. Only the random span ids, `sample_rand` values and ports differ. Full output is in
`out-develop-stream.txt` and `out-develop-static.txt`.

Stream run (`./run.sh 51341 51342 51343 51344`), recorder:

```
{"path": "/denoserve/via-fetch", "sentry-trace": null, "baggage": null, "traceparent": null}
{"path": "/denoserve/via-http", "sentry-trace": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-843e0fdb246b8b93-1", "baggage": "sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-environment=upstreamenv,sentry-transaction=upstream-tx,sentry-sample_rand=0.8386750418880752", "traceparent": null}
{"path": "/nodehttp/via-fetch", "sentry-trace": null, "baggage": null, "traceparent": null}
{"path": "/nodehttp/via-http", "sentry-trace": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bc8ab727dd359d8d-1", "baggage": "sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true,sentry-environment=upstreamenv,sentry-transaction=upstream-tx,sentry-sample_rand=0.7093623486710994", "traceparent": null}
```

Stream run, sink (the one span envelope holding both servers' segments):

```
{"type": "span", "dsc": {"trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "public_key": "public", "sample_rate": "1", "sampled": "true", "environment": "upstreamenv", "transaction": "upstream-tx", "sample_rand": "0.8386750418880752"}, "items": [{"op": "http.client", "name": "GET 127.0.0.1", "origin": "auto.http.client", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "843e0fdb246b8b93", "parent_span_id": "af5336a4b7cf0341", "is_segment": false}, {"op": "http.server", "name": "GET", "origin": "auto.http.deno", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "af5336a4b7cf0341", "parent_span_id": "bbbbbbbbbbbbbbbb", "is_segment": true}, {"op": "http.client", "name": "GET 127.0.0.1", "origin": "auto.http.client", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "bc8ab727dd359d8d", "parent_span_id": "bac925b128a9d8af", "is_segment": false}, {"op": "http.server", "name": "GET", "origin": "auto.http.server", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "bac925b128a9d8af", "parent_span_id": "bbbbbbbbbbbbbbbb", "is_segment": true}]}
ACTIVE {"tag":"denoserve","active":{"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"af5336a4b7cf0341","parent_span_id":"bbbbbbbbbbbbbbbb"}}
ACTIVE {"tag":"nodehttp","active":{"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab","span_id":"bac925b128a9d8af","parent_span_id":"bbbbbbbbbbbbbbbb"}}
```

Static run (`./run.sh 51351 51352 51353 51354 static`), sink:

```
{"type": "transaction", "name": "GET /probe", "op": "http.server", "source": "url", "status": "ok", "origin": "auto.http.deno", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "aa96a1d9a9d00bf2", "parent_span_id": "bbbbbbbbbbbbbbbb", "dsc": {"trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "public_key": "public", "sample_rate": "1", "sampled": "true", "environment": "upstreamenv", "transaction": "upstream-tx", "sample_rand": "0.03833485791327906"}, "spans": [{"op": "http.client", "description": "GET http://127.0.0.1:51354/denoserve/via-http", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "a15c9103793a56b9", "parent_span_id": "aa96a1d9a9d00bf2"}]}
{"type": "transaction", "name": "GET /probe", "op": "http.server", "source": "url", "status": "ok", "origin": "auto.http.server", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "8f5353b3716a9f01", "parent_span_id": "bbbbbbbbbbbbbbbb", "dsc": {"trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "public_key": "public", "sample_rate": "1", "sampled": "true", "environment": "upstreamenv", "transaction": "upstream-tx", "sample_rand": "0.012002181047126803"}, "spans": [{"op": "http.client", "description": "GET http://127.0.0.1:51354/nodehttp/via-http", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab", "span_id": "a805dc4e5ce94f57", "parent_span_id": "8f5353b3716a9f01"}]}
```

In both runs the outgoing `fetch` produced no `http.client` span at all and no propagation headers,
while the outgoing `node:http` request produced one parented on the continued server span.

## Files

- `main.ts` — the Deno app: `Sentry.init`, a `Deno.serve` server and a `node:http` server, both with
  `/probe` (fetch + node:http downstream calls, logs the active span) and `/sentinel`.
- `sink.mjs` — envelope sink extended to keep `trace_id`/`span_id`/`parent_span_id`/origin per span and
  the envelope-header DSC.
- `recorder.mjs` — downstream server recording `sentry-trace`/`baggage`/`traceparent` per request,
  readable at `GET /__recorded`.
- `run.sh` — driver; sends the upstream headers, waits for both sentinel events, prints and cleans up.
- `out-develop-stream.txt`, `out-develop-static.txt` — the outputs quoted above.
