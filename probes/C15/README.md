# C15 - Hono on Workers with `@sentry/hono/cloudflare`

Runtime: cloudflare (wrangler 4.129.0 / workerd local) | SDK: `@sentry/hono` + `@sentry/cloudflare`
10.67.0 (develop line, tarballs in `_toolbox/pack/`) | hono 4.13.7

## What it reproduces

A Hono app whose only Sentry setup is `app.use(sentry(app, env => ({ dsn, tunnel, tracesSampleRate: 1 })))`
from `@sentry/hono/cloudflare`, exported as the Worker's default handler and served by `wrangler dev`.
Four routes exercise the middleware: `/user/:id` (a parametrized route), `/error` (throws), `/downstream`
(a `fetch` to a plain host server that logs the trace headers it receives) and `/sentinel` (calls
`Sentry.captureMessage('sentinel')`, the sentinel that proves everything before it reached the sink).
It shows what the Hono middleware emits on Workers: route-named `http.server` segment spans as `span`
envelopes (stream lifecycle), the thrown error as an unhandled event with the Hono context-error
mechanism linked to its request span, and a child `http.client` span whose trace and span ids match the
`sentry-trace`/`baggage` headers the downstream server actually received.

## Install

```
npm install --no-audit --no-fund
```

Run it from this directory. `package.json` already points `@sentry/{hono,cloudflare,core,opentelemetry,server-utils,server-runtime-injection}`
at the tarballs in `../../_toolbox/pack/` and pulls `hono@^4` plus `wrangler@^4`.

## Run

From this directory:

```
: > raw.log
RAW=$PWD/raw.log PORT=34117 node sink.mjs > sink.log 2>&1 & spid=$!
sleep 1
node api.mjs 34119 > api.log 2>&1 & apid=$!
sleep 1
npx wrangler dev --port 34118 --inspector-port 0 \
  --var SENTRY_DSN:https://public@example.com/1 \
  --var SENTRY_TUNNEL:http://127.0.0.1:34117/ \
  --var API_PORT:34119 > app.log 2>&1 & wpid=$!
for i in $(seq 1 60); do grep -q "Ready on http://localhost:34118" app.log && break; sleep 1; done
node drive.mjs 34118 34117 > drive.out 2>&1   # hits /user/42 /error /downstream /sentinel, waits for the sentinel
curl -s http://127.0.0.1:34117/__items | python3 -m json.tool > items.json
node inspect.mjs raw.log | tee inspect.out
cat api.log
grep -n "boom\|GET /" app.log
kill $wpid; kill $apid; kill $spid
```

`sink.mjs` is `_toolbox/sink.mjs` with the C04 extensions (per-span `op`, `trace_id` and the full
attribute map, `contexts.cloud_resource`/`contexts.runtime` on events) plus an append of every raw
envelope to the file named by `$RAW`. `inspect.mjs` reads that file and prints the trace/span
correlation the compact sink drops.

## Expected

Recorded verdict: **works**.

Every request produces a route-named `http.server` span (`span` envelopes, stream lifecycle) with
`http.route` and `sentry.source` route; the thrown error on `/error` arrives as an unhandled event with
mechanism `auto.http.hono.context_error` linked to the `GET /error` span's trace and span id, and that
span has status `error`/500; the `fetch` on `/downstream` produces a child `http.client` span (name
`GET 127.0.0.1`, parent = the `http.server` span) and the host server received `sentry-trace`/`baggage`
whose trace id and span id match that `http.client` span.

Recorded evidence lines:

```
sink __items (compact):
{"type":"span","items":["http.server GET /user/:id"]}
{"type":"event","exception":"boom from /error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":{"name":"cloudflare"},"hasContextLine":false}
{"type":"span","items":["http.server GET /error"]}
{"type":"span","items":["http.client GET 127.0.0.1","http.server GET /downstream"]}
{"type":"event","message":"sentinel",...}

raw envelope correlation (inspect.mjs):
SPAN {"name":"GET /user/:id","trace":"d7361b99403f4dd29144f0a8fcd71ed3","span":"9b626ea54001421b","op":"http.server","status":"ok","route":"/user/:id","code":200,"origin":"auto.http.cloudflare"}
EVENT {"value":"boom from /error","trace":"48f3379c9342434e88b1f923723dfc59","span":"88a0959cfc13bc5e","mechanism":{"type":"auto.http.hono.context_error","handled":false},"transaction":"GET /error","request":{...,"method":"GET","url":"http://127.0.0.1:41421/error"},"sdk":"sentry.javascript.hono@10.67.0","integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"]}
SPAN {"name":"GET /error","trace":"48f3379c9342434e88b1f923723dfc59","span":"88a0959cfc13bc5e","op":"http.server","status":"error","route":"/error","code":500,"origin":"auto.http.cloudflare"}
SPAN {"name":"GET 127.0.0.1","trace":"d451a2ad46874fb09a1a1fd3a7b1a721","span":"85ddda7737f4611d","parent":"85c245d30c8f57b7","op":"http.client","status":"ok","code":200,"origin":"auto.http.fetch"}
SPAN {"name":"GET /downstream","trace":"d451a2ad46874fb09a1a1fd3a7b1a721","span":"85c245d30c8f57b7","op":"http.server","status":"ok","route":"/downstream","code":200,"origin":"auto.http.cloudflare"}

host api.log:
API HIT /api {"sentry-trace":"d451a2ad46874fb09a1a1fd3a7b1a721-85ddda7737f4611d-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=d451a2ad46874fb09a1a1fd3a7b1a721,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rand=0.16636039745201137,sentry-sample_rate=1"}

HTTP responses: /user/42 200 {"id":"42"}; /error 500 Internal Server Error; /downstream 200
```

Recorded side notes kept for context: the `sdk.integrations` list contains no `Hono` entry because
`@sentry/hono/cloudflare` filters the Cloudflare `honoIntegration` out on purpose
(`packages/hono/src/cloudflare/middleware.ts`); route naming (`sentry.source=route`, `http.route`) comes
from the middleware's own patches; on develop the `captureMessage('sentinel')` event carries a synthetic
exception value, which the compact sink reports as an `exception`; and Cloudflare's own
`Error: boom from /error` console line was recorded as appearing on 10.73.0 but not on develop.

## Observed on 2026-09-07

Matches the recorded verdict. Full output in `items.json` (compact sink), `inspect.out` (raw envelope
correlation), `raw.log` (raw envelopes), `drive.out`, `api.log` and `app.log`; trimmed:

```
sink __items (compact, trimmed to the fields the record quotes):
{"type":"span","items":["http.server GET /user/:id"]}
{"type":"event","exception":"Error: boom from /error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":"cloudflare","hasContextLine":false}
{"type":"span","items":["http.server GET /error"]}
{"type":"span","items":["http.client GET 127.0.0.1","http.server GET /downstream"]}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.hono"}
{"type":"span","items":["http.server GET /sentinel"]}

raw envelope correlation (inspect.out):
SPAN {"name":"GET /user/:id","trace":"accc961f17b647bc8e4fed2817b81216","span":"a056c1f1af7cc042","op":"http.server","status":"ok","route":"/user/:id","source":"route","code":200,"origin":"auto.http.cloudflare"}
EVENT {"value":"boom from /error","trace":"b4226ed99a85440195bf018c088bb565","span":"acbae668b6d7dd20","mechanism":{"type":"auto.http.hono.context_error","handled":false},"transaction":"GET /error","request":{"method":"GET","url":"http://127.0.0.1:34118/error"},"sdk":"sentry.javascript.hono@10.67.0","integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"]}
SPAN {"name":"GET /error","trace":"b4226ed99a85440195bf018c088bb565","span":"acbae668b6d7dd20","op":"http.server","status":"error","route":"/error","source":"route","code":500,"origin":"auto.http.cloudflare"}
SPAN {"name":"GET 127.0.0.1","trace":"989b848e6c3e44e2b453d2bb748130e1","span":"ad962814977b640f","parent":"98f6cac710f04f59","op":"http.client","status":"ok","code":200,"origin":"auto.http.fetch"}
SPAN {"name":"GET /downstream","trace":"989b848e6c3e44e2b453d2bb748130e1","span":"98f6cac710f04f59","op":"http.server","status":"ok","route":"/downstream","source":"route","code":200,"origin":"auto.http.cloudflare"}
EVENT {"value":"sentinel","trace":"9f49e5ea71e24991a09af46aa27c20b9","span":"8dc7def7a2b969df","mechanism":{"type":"generic","handled":true,"synthetic":true},"transaction":"GET /sentinel","request":{"method":"GET","url":"http://127.0.0.1:34118/sentinel"},"sdk":"sentry.javascript.hono@10.67.0","integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"]}
SPAN {"name":"GET /sentinel","trace":"9f49e5ea71e24991a09af46aa27c20b9","span":"8dc7def7a2b969df","op":"http.server","status":"ok","route":"/sentinel","source":"route","code":200,"origin":"auto.http.cloudflare"}

host api.log:
API HIT /api {"sentry-trace":"989b848e6c3e44e2b453d2bb748130e1-ad962814977b640f-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=989b848e6c3e44e2b453d2bb748130e1,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rand=0.5604449836528649,sentry-sample_rate=1"}

drive.out (HTTP responses):
/user/42 200 {"id":"42"}
/error 500 Internal Server Error
/downstream 200 {"ok":true}
/sentinel 200 sentinel
```

Every recorded element reproduced: route-named `http.server` segment spans in `span` envelopes with
`sentry.trace_lifecycle: stream`, `http.route` and `sentry.segment.name.source: route`; the unhandled
event with mechanism `auto.http.hono.context_error` and `handled: false`, whose `contexts.trace`
trace id and span id (`b4226ed9…` / `acbae668b6d7dd20`) are exactly the `GET /error` span's, which
carries `status: error` and `http.response.status_code: 500`; the child `http.client` span named
`GET 127.0.0.1` parented to the `GET /downstream` segment span; and the downstream server receiving
`sentry-trace` `989b848e…-ad962814977b640f-1`, whose trace id and span id are that `http.client` span's.
The `sdk.integrations` list is identical to the record's, with no `Hono` entry, and the sentinel event
still carries the synthetic exception the record noted.

Differences, none of them behavioural: ids, ports and sample_rand are per-run; the sink here formats
`exception` as `"<type>: <value>"`, so the error reads `Error: boom from /error` where the record
trimmed it to `boom from /error`, and the synthetic sentinel reads `undefined: sentinel`; hono resolved
to 4.13.7 rather than the recorded 4.13.5; `inspect.mjs` also prints the `sentry.segment.name.source`
as `source`, a field the recorded lines did not carry; and Cloudflare's `Error: boom from /error`
console line *did* appear in `app.log` here (wrangler 4.129.0), where the record noted it as absent on
develop. npm printed `allow-scripts` warnings for `esbuild` and `workerd` postinstalls; the
`workerd-darwin-arm64` binary was present and `wrangler dev` started normally.

## Files

- `src/index.ts` - the Hono app: `app.use(sentry(app, env => ({...})))` plus the four routes
- `wrangler.jsonc` - `compatibility_date` 2026-05-01, `nodejs_compat`
- `package.json` - tarball dependencies, hono, wrangler
- `sink.mjs` - envelope sink, compact `__items` plus raw envelopes appended to `$RAW`
- `inspect.mjs` - prints the SPAN/EVENT trace correlation from `raw.log`
- `api.mjs` - the plain host server `/downstream` calls; logs `sentry-trace`/`baggage`
- `drive.mjs` - driver: hits the four routes from a plain node process, waits for the sentinel
- `items.json`, `inspect.out`, `raw.log`, `drive.out`, `api.log`, `app.log`, `sink.log` - output of the run above
