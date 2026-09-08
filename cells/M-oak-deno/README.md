# M-oak-deno

Oak 17.2.0 (`jsr:@oak/oak`) with `@sentry/deno` 10.67.0 (develop, `6f2da7483d`) on Deno 2.9.0.

## What it reproduces

An Oak application served two ways on Deno, to show that the mount shape decides whether the SDK
works at all. With `Deno.serve(app.fetch)` the `denoServeIntegration` proxy opens the isolation scope
and the `http.server` span around the whole Oak dispatch, and six of the seven matrix capabilities
behave: errors (Oak re-throws out of `app.fetch`, so the Deno.serve wrapper captures them
automatically as `auto.http.deno`, and a try/catch middleware captures them as `oak`), per-request
isolation, incoming trace continuation, nested `db` spans from a module-scope `mysql` connection, and
logs. Route names are only **partial**: nothing names the span after the matched Oak route out of the
box (`http.server GET` src=url in stream, the raw URL in static), a ~6-line middleware reading
`ctx.matched.at(-1).path` plus `updateSpanName` + `SENTRY_SEGMENT_NAME_SOURCE` is needed, and because
it runs after `await next()` it never fires on the error path. Outgoing `fetch` is **broken**: no
`http.client` span and no `sentry-trace`/`baggage` on the wire, the known Deno K2 gap. The
`main-listen.ts` variant shows the contrast: Oak's own `listen()` server drains requests through an
async queue, so the handler body escapes the AsyncLocalStorage context, and route naming no-ops, the
db span becomes its own root transaction, request errors never reach Sentry, and isolation scopes
leak across concurrent requests.

Files: `instrument.ts` (SDK init behind the `@sentry/deno/import` hook), `routes.ts` (the Oak app and
both middlewares), `main.ts` (`Deno.serve(app.fetch)`), `main-listen.ts` (`app.listen()` contrast),
`bare.ts` (Oak without Sentry, viability check), `sink.mjs` (the `_toolbox` envelope sink extended
with trace/parent/source on span items, trace ids on events and logs, db attributes on transaction
spans, and a `/rec/*` endpoint that records incoming downstream request headers).

## Install

```
npm install --ignore-scripts
```

Run it from this directory. `path-to-regexp@6.3.0` is a pinned dependency on purpose: it is Oak's
only npm dependency, and with `nodeModulesDir: "manual"` the app does not boot without it
(`error: Could not find a matching package for 'npm:path-to-regexp@^6.3.0' in the node_modules
directory` at `jsr.io/@oak/oak/17.2.0/deps.ts:79:8`). MariaDB must be reachable on `127.0.0.1:3307`
(user `root`, no password, database `app`, table `users`).

## Run

```
cd $REPRO/cells/M-oak-deno

# sink + downstream header recorder on 41730
PORT=41730 node sink.mjs > sink.log 2>&1 &

# viability, no Sentry
APP_PORT=41731 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys bare.ts &
curl -s http://127.0.0.1:41731/users/42          # -> {"id":"42"}

# A. Deno.serve(app.fetch), default stream lifecycle, Sentry error middleware ON
SINK=41730 APP_PORT=41731 LIFECYCLE=stream \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app-stream.log 2>&1 &

# B. Deno.serve(app.fetch), static lifecycle, error middleware OFF
SINK=41730 APP_PORT=41731 LIFECYCLE=static ERRMW=off \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts > app-static.log 2>&1 &

# C. app.listen() contrast, static lifecycle, error middleware OFF
SINK=41730 APP_PORT=41732 LIFECYCLE=static ERRMW=off \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-listen.ts > app-listen.log 2>&1 &

# drive, from plain curl so no unsampled client-side sentry-trace leaks in
B=http://127.0.0.1:41731
curl -s $B/users/7
curl -s $B/error
curl -s $B/db
curl -s $B/downstream
curl -s $B/log
(curl -s $B/iso/alpha & curl -s $B/iso/bravo & curl -s $B/iso/charlie & wait)
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1111111111111111-1' \
        -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' \
        $B/users/42
curl -s $B/sentinel                              # sentinel; poll __items until it lands

# read
curl -s http://127.0.0.1:41730/__items
curl -s http://127.0.0.1:41730/__recorded
curl -s -X DELETE http://127.0.0.1:41730/__items
curl -s -X DELETE http://127.0.0.1:41730/__recorded

# other knobs: NAMING=off drops the route-name middleware
```

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | **partial** (needs the `ctx.matched` middleware; never fires on the error path) |
| isolation | works (with `app.fetch`; broken under `app.listen()`) |
| incoming trace | works |
| outgoing fetch | **broken** |
| db spans | works |
| logs | works |
| client errors | not-run (server-only framework) |

Recorded evidence lines:

```
### A. Deno.serve(app.fetch), traceLifecycle: 'stream', Sentry error middleware ON
{"type":"event","exception":"oak route boom","mechanism":"oak","handled":false,"trace_id":"c843de4cebda4ec28ca8c58b339a2522","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso bravo","mechanism":"generic","handled":true,"tags":{"who":"bravo"},"trace_id":"afbb6433841d471bbfb62925740693d4","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso alpha","mechanism":"generic","handled":true,"tags":{"who":"alpha"},"trace_id":"a7fd5c8b7cdf467682ae27d09a0bbe7b","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso charlie","mechanism":"generic","handled":true,"tags":{"who":"charlie"},"trace_id":"3ca6a54696ec4f84ba95e00ad09c5cb5","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"span","items":["http.server GET /users/:id :: trace=ff986615185349968ab7959f1e75e26c parent=- src=route"]}
{"type":"span","items":["http.server GET :: trace=c843de4cebda4ec28ca8c58b339a2522 parent=- src=url"]}
{"type":"span","items":["http.server GET /downstream :: trace=188084def4d1472ab686f27ee597a8e2 parent=- src=route"]}
{"type":"span","items":["db SELECT users :: trace=47a6e49abf584e7fae6c5ca1f830bf21 parent=acaa9154f7296eee src=-","http.server GET /db :: trace=47a6e49abf584e7fae6c5ca1f830bf21 parent=- src=route"]}
{"type":"span","items":["http.server GET /log :: trace=96ff9d665adc4729880bc3fa893f4c63 parent=- src=route"]}
{"type":"span","items":["http.server GET /iso/:tag :: trace=afbb6433841d471bbfb62925740693d4 parent=- src=route"]}
{"type":"span","items":["http.server GET /iso/:tag :: trace=a7fd5c8b7cdf467682ae27d09a0bbe7b parent=- src=route"]}
{"type":"span","items":["http.server GET /iso/:tag :: trace=3ca6a54696ec4f84ba95e00ad09c5cb5 parent=- src=route"]}
{"type":"span","items":["http.server GET /users/:id :: trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa parent=1111111111111111 src=route"]}
{"type":"log","items":["info: hello from oak :: trace=96ff9d665adc4729880bc3fa893f4c63"]}

Recorder for the outgoing fetch (no propagation headers at all):
[{"url":"/rec/from-oak"}]

### B. Deno.serve(app.fetch), traceLifecycle: 'static', Sentry error middleware OFF
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"ok","trace_id":"717ca82bf274494bb3baf713c20da504","spans":[]}
{"type":"event","exception":"oak route boom","mechanism":"auto.http.deno","handled":false,"trace_id":"717ca82bf274494bb3baf713c20da504","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"901e5e8906a94180b867f6f1f926a7c7","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"9761d7f308c344ffaecbe7b9d200df83","spans":["db SELECT id, name FROM users :: {\"stmt\":\"SELECT id, name FROM users\",\"sys\":\"mysql\"}"]}
```

Recorded for `app.listen()` (from the capability details, no verbatim envelope block was kept): all
three concurrent events carry the same tag `{who: charlie}` and the same stale trace id from an
earlier request, route naming silently no-ops, the mysql span is emitted as its own root transaction
with its own trace id, and request errors never reach Sentry at all.

## Observed on 2026-09-07

Rebuilt and run once. **All eight capability verdicts match the record**, and the `app.listen()`
contrast reproduces as described. Trace ids differ per run, as they must.

A. `Deno.serve(app.fetch)`, stream lifecycle, error middleware ON (`observed-stream-items.json`):

```
{"type":"event","exception":"oak route boom","mechanism":"oak","handled":false,"trace_id":"0f6eaf33744748c8808127550ddcdc52","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso alpha","mechanism":"generic","handled":true,"tags":{"who":"alpha"},"trace_id":"7987ebc4b64b4694ba740d3ef770098f","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso bravo","mechanism":"generic","handled":true,"tags":{"who":"bravo"},"trace_id":"75e82bc6817d4a87bc581aa270bbbfdc","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso charlie","mechanism":"generic","handled":true,"tags":{"who":"charlie"},"trace_id":"c6a3609532a048e2be8e0827aec5ceac","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"span","items":["http.server GET /users/:id :: trace=2931474d27854dafab3ec6a4864bdd13 parent=- src=route"]}
{"type":"span","items":["http.server GET :: trace=0f6eaf33744748c8808127550ddcdc52 parent=- src=url"]}
{"type":"span","items":["db SELECT users :: trace=bde0a3fbd533463f8abeb4e7d18b2d5d parent=b1a51cd3ee3c8543 src=-","http.server GET /db :: trace=bde0a3fbd533463f8abeb4e7d18b2d5d parent=- src=route"]}
{"type":"span","items":["http.server GET /downstream :: trace=f53264067f7d4ddab253438603bbfd40 parent=- src=route"]}
{"type":"span","items":["http.server GET /log :: trace=5c3ba40ae75745399559f439c73e5be8 parent=- src=route"]}
{"type":"span","items":["http.server GET /iso/:tag :: trace=7987ebc4b64b4694ba740d3ef770098f parent=- src=route"]}
{"type":"span","items":["http.server GET /iso/:tag :: trace=75e82bc6817d4a87bc581aa270bbbfdc parent=- src=route"]}
{"type":"span","items":["http.server GET /iso/:tag :: trace=c6a3609532a048e2be8e0827aec5ceac parent=- src=route"]}
{"type":"span","items":["http.server GET /users/:id :: trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa parent=1111111111111111 src=route"]}
{"type":"log","items":["info: hello from oak :: trace=5c3ba40ae75745399559f439c73e5be8"]}
```

Downstream header recorder (`observed-stream-recorded.json`) — the whole `fetch` finding in one row:

```
[{"url":"/rec/from-oak"}]
```

B. `Deno.serve(app.fetch)`, static lifecycle, error middleware OFF (`observed-static-items.json`):

```
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"ok","trace_id":"d1101003a87c4ece9cb45087191c1ddd","spans":[]}
{"type":"event","exception":"oak route boom","mechanism":"auto.http.deno","handled":false,"trace_id":"d1101003a87c4ece9cb45087191c1ddd","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"4b8224d39dd64f6199762632f77a6d37","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"5783113550ca46ffb64101260cd9d9a9","spans":["db SELECT id, name FROM users :: {\"stmt\":\"SELECT id, name FROM users\",\"sys\":\"mysql\"}"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","trace_id":"6cac74ad62f34c06bb36c69ec90f9ea8","spans":[]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","parent_span_id":"2222222222222222","spans":[]}
{"type":"log","items":["info: hello from oak :: trace=951cd365ca13457f88bbbe9a328a431b"]}
```

C. `app.listen()`, static lifecycle (`observed-listen-items.json`) — every failure the record names:

```
{"type":"transaction","name":"GET /users/7","op":"http.server","source":"url","status":"ok","trace_id":"b84351729a0a43a584fffef2e7fa96ec","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"3653e07c064449028e4770c3e858a3f6","spans":[]}
{"type":"transaction","name":"SELECT id, name FROM users","op":"db","source":"custom","status":"ok","trace_id":"f4bd8603784445ce8d5f9714875a0fd5","spans":[]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"dea2c5e53448446f93ace7007735fa5a","spans":[]}
{"type":"event","exception":"iso charlie","mechanism":"generic","handled":true,"tags":{"who":"charlie"},"trace_id":"f4bd8603784445ce8d5f9714875a0fd5","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso bravo","mechanism":"generic","handled":true,"tags":{"who":"charlie"},"trace_id":"f4bd8603784445ce8d5f9714875a0fd5","sdk":"sentry.javascript.deno","hasContextLine":true}
{"type":"event","exception":"iso alpha","mechanism":"generic","handled":true,"tags":{"who":"charlie"},"trace_id":"f4bd8603784445ce8d5f9714875a0fd5","sdk":"sentry.javascript.deno","hasContextLine":true}
```

Per-capability comparison:

- **errors** — matches. With the middleware on, the event carries mechanism `oak`, `handled:false`,
  context lines; with it off, the same error still arrives via the Deno.serve wrapper as
  `auto.http.deno`, `handled:false`, on the request's own trace id. Oak returns 500 and survives.
- **route names** — matches the recorded **partial**. The `/error` span keeps `src=url` (stream) /
  `source: "url"` (static) because the naming middleware sits after `await next()`; every other
  route gets `GET /users/:id`, `GET /iso/:tag` with `src=route` only because that middleware runs.
- **isolation** — matches. Under `app.fetch`, three concurrent `/iso/:tag` requests produced three
  events with exactly their own tag and three distinct trace ids, each equal to its own
  `http.server` span's trace id. Under `app.listen()`, all three carried `{who: charlie}` and the
  same stale trace id `f4bd8603784445ce8d5f9714875a0fd5`, which is the *db* root transaction's id.
- **incoming trace** — matches. `trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa parent=1111111111111111`
  in stream, `trace_id: bbbb…` / `parent_span_id: 2222222222222222` in static.
- **outgoing fetch** — matches the recorded **broken**. `/downstream` produced only the
  `http.server` span (stream) / `spans: []` (static) and the recorder saw no `sentry-trace` and no
  `baggage`: `[{"url":"/rec/from-oak"}]`.
- **db spans** — matches. Static nests `db SELECT id, name FROM users` with
  `db.query.text` / `db.system: mysql` under the request transaction; stream emits
  `db SELECT users` with `parent=b1a51cd3ee3c8543`, the `http.server GET /db` span id, on the same
  trace. Under `app.listen()` it detaches into its own root transaction, as recorded.
- **logs** — matches. `info: hello from oak :: trace=5c3ba40ae75745399559f439c73e5be8`, the same
  trace id as the `http.server GET /log` span.
- **client errors** — not-run, as recorded. Oak is server-only.

One incidental difference, not a behavior change: with the naming middleware enabled the static run
names `/users/7` as `GET /users/:id` `source: "route"`, whereas the record's capability text quotes
`GET /users/7` `source=url` for the out-of-the-box case. Run with `NAMING=off` to see that shape.
