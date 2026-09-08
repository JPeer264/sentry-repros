# C13 - Request body capture on Workers

## What it reproduces

A Cloudflare Worker wrapped with `Sentry.withSentry` from `@sentry/cloudflare` on the `develop`
line (v11, package version 10.67.0) captures the JSON body of an incoming POST and attaches it to
the outgoing telemetry. With `dataCollection: {}` (the default `httpBodies`, which includes
`incomingRequest`) the body lands in `request.data` on both the error event and the transaction
under `traceLifecycle: 'static'`, and as the `http.request.body.data` attribute on the
`http.server` segment span under `traceLifecycle: 'stream'`. Turning bodies off with either
`Sentry.httpServerIntegration({ maxRequestBodySize: 'none' })` or `dataCollection: { httpBodies: [] }`
removes `request.data` from both event and transaction. The Worker takes the configuration from the
`MODE` var (`dc` / `none` / `dcoff`) and the lifecycle from the `LIFECYCLE` var, so all four
variants run from one source file.

## Install

```
cd $REPRO/probes/C13 && npm install
```

## Run

```
D=$REPRO/probes/C13
cd $D && PORT=41337 node sink.mjs > sink.log 2>&1 & sinkpid=$!

# one wrangler dev at a time; wait for "Ready on http" in the log before driving it
cd $D && npx wrangler dev --port 41401 --inspector-port 0 --var MODE:dc    --var SINK_PORT:41337 --var LIFECYCLE:static > wrangler-dc.log     2>&1 & w=$!
cd $D && node drive.mjs 41401 41337 '[develop/dc]'        | tee run-dc.txt        ; kill $w; wait $w

cd $D && npx wrangler dev --port 41402 --inspector-port 0 --var MODE:none  --var SINK_PORT:41337 --var LIFECYCLE:static > wrangler-none.log   2>&1 & w=$!
cd $D && node drive.mjs 41402 41337 '[develop/none]'      | tee run-none.txt      ; kill $w; wait $w

cd $D && npx wrangler dev --port 41403 --inspector-port 0 --var MODE:dcoff --var SINK_PORT:41337 --var LIFECYCLE:static > wrangler-dcoff.log  2>&1 & w=$!
cd $D && node drive.mjs 41403 41337 '[develop/dcoff]'     | tee run-dcoff.txt     ; kill $w; wait $w

cd $D && npx wrangler dev --port 41404 --inspector-port 0 --var MODE:dc    --var SINK_PORT:41337 --var LIFECYCLE:stream > wrangler-stream.log 2>&1 & w=$!
cd $D && node drive.mjs 41404 41337 '[develop/dc-stream]' | tee run-dc-stream.txt ; kill $w; wait $w

kill $sinkpid; wait $sinkpid

grep -n maxRequestBodySize $D/node_modules/@sentry/cloudflare/build/types/integrations/httpServer.d.ts
```

## Expected

Recorded verdict: **works**.

With `dataCollection: {}` the JSON body of a POST to a throwing route lands in `request.data` on
both the error event and the transaction (static lifecycle), and as `http.request.body.data` on the
`http.server` segment span (stream lifecycle). Disabling bodies either via
`httpServerIntegration({ maxRequestBodySize: 'none' })` or via `dataCollection: { httpBodies: [] }`
removes `request.data` from both event and transaction. Built types expose
`maxRequestBodySize?: MaxRequestBodySize` with `@default 'medium'` on `HttpServerIntegrationOptions`.

Recorded evidence lines:

```
MODE=dc (dataCollection: {}), traceLifecycle static:
{"type":"transaction","name":"POST /throw","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41401/throw","data":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","hasData":true,"contentType":"application/json"}}
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41401/throw","data":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","hasData":true,"contentType":"application/json"}}
MODE=none (httpServerIntegration({ maxRequestBodySize: 'none' })):
{"type":"transaction","name":"POST /throw","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41402/throw","data":null,"hasData":false,"contentType":"application/json"}}
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41402/throw","data":null,"hasData":false,"contentType":"application/json"}}
MODE=dcoff (dataCollection: { httpBodies: [] }):
{"type":"transaction","name":"POST /throw","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41403/throw","data":null,"hasData":false,"contentType":"application/json"}}
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41403/throw","data":null,"hasData":false,"contentType":"application/json"}}
MODE=dc, traceLifecycle stream (default on develop):
{"type":"span","items":[{"name":"http.server POST","bodyAttr":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","method":"POST"}]}
Built types (node_modules/@sentry/cloudflare/build/types/integrations/httpServer.d.ts:18): `maxRequestBodySize?: MaxRequestBodySize;` with JSDoc `@default 'medium'`, plus `ignoreRequestBody?: (url: string, request: Request) => boolean;`
```

Recorded notes worth keeping: body capture happens for every POST (also the non-throwing `/ok`
route), not only on error, and the body string is stored raw (the JSON stays a string in
`request.data`, it is not parsed). On 10.73.0 `dataCollection: { httpBodies: [] }` was ignored for
incoming request bodies on Cloudflare; develop fixes that in
`captureIncomingRequestBody` (`packages/cloudflare/src/integrations/httpServer.ts:88-91`).

## Observed on 2026-09-07

```
--- sink [develop/dc] ---
{"type":"transaction","name":"POST /throw","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41401/throw","data":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","hasData":true,"contentType":"application/json"}}
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41401/throw","data":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","hasData":true,"contentType":"application/json"}}
{"type":"transaction","name":"POST /ok","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41401/ok","data":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","hasData":true,"contentType":"application/json"}}

--- sink [develop/none] ---
{"type":"transaction","name":"POST /throw","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41402/throw","data":null,"hasData":false,"contentType":"application/json"}}
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41402/throw","data":null,"hasData":false,"contentType":"application/json"}}

--- sink [develop/dcoff] ---
{"type":"transaction","name":"POST /throw","op":"http.server","request":{"method":"POST","url":"http://127.0.0.1:41403/throw","data":null,"hasData":false,"contentType":"application/json"}}
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41403/throw","data":null,"hasData":false,"contentType":"application/json"}}

--- sink [develop/dc-stream] ---
{"type":"event","exception":"throw route boom","mechanism":"auto.http.cloudflare","request":{"method":"POST","url":"http://127.0.0.1:41404/throw","data":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","hasData":true,"contentType":"application/json"}}
{"type":"span","items":[{"name":"http.server POST","bodyAttr":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","method":"POST"}]}
{"type":"span","items":[{"name":"http.server POST","bodyAttr":"{\"user\":\"jan\",\"secret\":\"hunter2\",\"n\":42}","method":"POST"}]}
{"type":"span","items":[{"name":"http.server GET","bodyAttr":null,"method":"GET"}]}

$ grep -n "maxRequestBodySize\|@default 'medium'\|ignoreRequestBody?" node_modules/@sentry/cloudflare/build/types/integrations/httpServer.d.ts
16:     * @default 'medium'
18:    maxRequestBodySize?: MaxRequestBodySize;
35:    ignoreRequestBody?: (url: string, request: Request) => boolean;
48: *       maxRequestBodySize: 'medium',
```

Matches the recorded verdict: **yes**. Every recorded evidence line reproduced verbatim, including
the `httpServer.d.ts:18` line number for `maxRequestBodySize?: MaxRequestBodySize;`. The one
difference is presentational, not behavioural: this rebuild ran the four wrangler instances
sequentially on the recorded ports instead of in parallel, so the `--persist-to` flags the record
used to work around a parallel-start `SQLITE_READONLY` crash are not needed here.

## Files

- `src/index.ts` - the Worker, configured by the `MODE` and `LIFECYCLE` vars
- `drive.mjs` - POSTs the JSON body to `/throw` and `/ok`, waits for the `sentinel` event, prints the sink
- `sink.mjs` - envelope sink; its compact mapping keeps `request.data` / `contentType` and the span `http.request.body.data` attribute
- `wrangler.jsonc` - `compatibility_date: 2026-05-01`, `nodejs_compat`
- `run-dc.txt`, `run-none.txt`, `run-dcoff.txt`, `run-dc-stream.txt`, `run-types.txt` - captured output
