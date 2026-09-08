# M-hapi-bun

`@hapi/hapi` 21.3.10 on Bun 1.4.0 with `@sentry/bun` 10.67.0 (develop @ `6f2da7483d`).

## What it reproduces

Hapi runs on Bun unchanged, and the full Sentry feature set (errors, parameterized route names,
request isolation, incoming trace continuation, outgoing `fetch` spans and headers, mysql spans,
logs) is available only from a Bun plugin build: `Bun.build({ ..., plugins: [sentryBunPlugin()] })`
and then `bun dist/app.js`. `instrument.ts` is imported as the first line of `app.ts`, the mysql
connection is created at module scope (K11), and `setupHapiErrorHandler` is **not** called: on
develop the hapi error handler is auto-registered from the orchestrion `@hapi/hapi`
`start`/`initialize` channels. Both `traceLifecycle: "static"` (transaction envelopes) and the
default `"stream"` (span envelopes) are exercised.

## Install

```
cd $REPRO/cells/M-hapi-bun && npm install
```

(The `@sentry/*` deps resolve to the tarballs in `../../_toolbox/pack/`. `dist/` is checked in, so a
rebuild is only needed after editing `app.ts`: `bun run build.ts`.)

## Run

MariaDB must be up on `127.0.0.1:3307` (root, no password, db `app`, table `users`).

```
cd $REPRO/cells/M-hapi-bun

# sink (also the /rec recorder for the outgoing-fetch headers)
PORT=52807 node sink.mjs > sink-static.log 2>&1 &

bun run build.ts                     # only if dist/ is missing or app.ts changed

# static lifecycle: transaction envelopes with nested spans[]
SINK_PORT=52807 APP_PORT=52808 LIFECYCLE=static bun dist/app.js > app-static.log 2>&1 &
SINK_PORT=52807 APP_PORT=52808 node drive.mjs > drive-static.log 2>&1

# stream lifecycle: span envelopes (kill the app, clear the sink, restart)
curl -s -X DELETE http://127.0.0.1:52807/__items
SINK_PORT=52807 APP_PORT=52808 LIFECYCLE=stream bun dist/app.js > app-stream.log 2>&1 &
SINK_PORT=52807 APP_PORT=52808 node drive.mjs > drive-stream.log 2>&1
```

`drive.mjs` is a plain `node` process (not Sentry-initialized) so the incoming requests are not
marked unsampled. It hits `/users/42`, `/error`, three concurrent `/iso/{tag}`, `/users/42` with an
incoming `sentry-trace`, `/downstream`, `/db`, `/log`, then `/sentinel`, waits for the sentinel event
and 7s for the log timer flush, and prints the sink items plus the recorder hits.

## Expected

Recorded verdict: all seven capabilities `works` (errors, route names, isolation, incoming trace,
outgoing fetch, db spans, logs).

Recorded evidence (bundled, `traceLifecycle: "static"`):

```
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","trace_id":"9cb5bc54e1c74f95b88bcffcb41f3677","spans":["router GET /users/{id}"]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"71711da7c8384b3fbfaff2c2ab1e63e0","spans":["router GET /error"]}
{"type":"event","exception":"hapi-handler-boom","mechanism":"auto.function.hapi","handled":false,"trace_id":"71711da7c8384b3fbfaff2c2ab1e63e0","transaction":"GET /error","request":"http://127.0.0.1:41401/error","hasContextLine":true}
{"type":"event","exception":"iso-bravo","mechanism":"generic","handled":true,"tags":{"who":"bravo"},"trace_id":"d651d36541bd4c18b3e326e88f8d07e3","transaction":"GET /iso/bravo","request":"http://127.0.0.1:41401/iso/bravo","hasContextLine":true}
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["router GET /users/{id}"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","trace_id":"09877c065bf34788bd64eb322807425b","spans":["router GET /downstream","http.client GET http://127.0.0.1:41400/rec/from-hapi"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"b8fffd726d9e473bb8d1fe0bd84cb663","spans":["router GET /db","db SELECT id, name FROM users"]}
{"type":"log","items":["info: hapi-log-line"]}
```

Recorded evidence (bundled, `traceLifecycle: "stream"`):

```
router /users/{id} | http.server GET /users/{id}
router /error | http.server GET /error
http.client GET 127.0.0.1 | router /downstream | http.server GET /downstream
db SELECT users | router /db | http.server GET /db
{"n":"http.server GET /users/{id}","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","span_id":"8d80d87741479741"}
```

Recorded recorder headers on the outgoing fetch:

```
{"url":"/rec/from-hapi","sentryTrace":"1f70c7c830714154abd7922b132d837d-afc3fbaea08693b8-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=1f70c7c830714154abd7922b132d837d,sentry-org_id=1,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rand=0.38719181745022,sentry-sample_rate=1"}
```

## Observed on 2026-09-07

Matches the recorded verdict: all seven capabilities `works`, in both lifecycles.

`drive-static.log` (trimmed, `traceLifecycle: "static"`):

```
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","trace_id":"b5dd88cf8c544b3c8af4bd31a0241d54","spans":["router GET /users/{id}"]}
{"type":"event","exception":"Error: hapi-handler-boom","mechanism":"auto.function.hapi","handled":false,"hasContextLine":true,"transaction":"GET /error","trace_id":"88a286f62fec446dbe4ffab8ebd5aa7d","request":{"url":"http://127.0.0.1:52808/error","method":"GET"}}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"88a286f62fec446dbe4ffab8ebd5aa7d","spans":["router GET /error"]}
{"type":"event","exception":"Error: iso-bravo","mechanism":"generic","handled":true,"transaction":"GET /iso/bravo","trace_id":"3d1ed6e38f8443cfa5d3c4a064895746","tags":{"who":"bravo"}}
{"type":"event","exception":"Error: iso-charlie","mechanism":"generic","handled":true,"transaction":"GET /iso/charlie","trace_id":"10c6593acab3461bae6a77577ce2c314","tags":{"who":"charlie"}}
{"type":"event","exception":"Error: iso-alpha","mechanism":"generic","handled":true,"transaction":"GET /iso/alpha","trace_id":"f997a885096d4af39c93e15af26c73a3","tags":{"who":"alpha"}}
{"type":"transaction","name":"GET /iso/{tag}","op":"http.server","source":"route","status":"ok","trace_id":"3d1ed6e38f8443cfa5d3c4a064895746","spans":["router GET /iso/{tag}"]}
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":["router GET /users/{id}"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","trace_id":"b36af8d35134487b9e374da08ae66638","spans":["router GET /downstream","http.client GET http://127.0.0.1:52807/rec/from-hapi"]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"450505ef53ea488ba4df911df6a8ca12","spans":["router GET /db","db SELECT id, name FROM users"]}
{"type":"log","items":["info: hapi-log-line :: trace=c61001623e354420a50ea5218cae1383"]}
--- recorder hits ---
{"url":"/rec/from-hapi","sentryTrace":"b36af8d35134487b9e374da08ae66638-a0bf376f86f98d39-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=b36af8d35134487b9e374da08ae66638,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rand=0.6220129673675281,sentry-sample_rate=1"}
```

`drive-stream.log` (trimmed, `traceLifecycle: "stream"`):

```
{"type":"span","trace_id":"7411285964c44c5a8848eeb3d6bd7e85","items":["router /users/{id}","http.server GET /users/{id}"]}
{"type":"span","trace_id":"fd3e6eebe60c4afb91439a34d676e24f","items":["router /error","http.server GET /error"]}
{"type":"span","trace_id":"2e65d02fd68441a6be8f9e47287cdf38","items":["http.client GET 127.0.0.1","router /downstream","http.server GET /downstream"]}
{"type":"span","trace_id":"c1d1ada66645409a91df47b5afbc843b","items":["db SELECT users","router /db","http.server GET /db"]}
{"name":"GET /users/{id}","op":"http.server","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","span_id":"951b5e021f31f572","parent_span_id":"bbbbbbbbbbbbbbbb","is_segment":true,"origin":"auto.http.server","http_route":"/users/{id}"}
{"type":"log","items":["info: hapi-log-line :: trace=c40b86c25bfd4731becd24c2e56cb0e4"]}
```

Only difference from the record: the outgoing baggage carries no `sentry-org_id` member, because
this rebuild's DSN (`https://public@example.invalid/1`) has no org id in the host, unlike the DSN
used in the original run. Nothing capability-relevant differs.

The counterfactuals in the record (plain `bun app.ts`, and the deprecated
`setupHapiErrorHandler`) were not re-run; this rebuild only covers the supported plugin-build shape.

Ports used: sink/recorder 52807, app 52808. Both processes killed, both ports free.
