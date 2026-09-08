# M-hapi-deno — @hapi/hapi 21.4.x on Deno 2.9.0

SDK under test: `develop` (`getsentry/sentry-javascript` @ `6f2da7483d`, package version 10.67.0),
installed from the tarballs in `_toolbox/pack/`. Never install 10.73.0 here.

## What it reproduces

On Deno the Hapi story with `@sentry/deno` is all-or-nothing and gated on a Deno bug. Without
`import "@sentry/deno/import"` (the diagnostics-channel injection hook) the app boots and you get
`denoHttpIntegration` transactions, isolation, incoming trace continuation and logs, but the route
names stay unparameterized (`GET /users/42`, source `url`), there are no db spans, and — worst — a
throw in a route handler produces **no event at all**, because Hapi swallows it into a Boom 500 and
nothing else observes it. Turning the hook on gives all three (route names `GET /users/{id}` with
source `route`, a nested `router` span, `db SELECT id, name FROM users`, and an
`auto.function.hapi` / `handled: false` event) — but the app then does not start: with any
`Module.registerHooks` load hook registered, Deno compiles `require('../package.json')` in
`@hapi/validate/lib/common.js:6` through the CJS compiler and throws
`SyntaxError: Unexpected token ':'` (denoland/deno#36240, K3). A 12-line `json-fix.mjs` imported
straight after the hook closes that gap completely. Outgoing `fetch()` stays broken in every
configuration (no `http.client` span, no `sentry-trace`/`baggage`) — that is K2, and it is
fetch-specific: `node:http.get()` from the same handler is instrumented and does propagate headers.

## Install

```
cd $REPRO/cells/M-hapi-deno && npm install --no-audit --no-fund
```

A real `node_modules` on disk is required: `deno.json` sets `"nodeModulesDir": "manual"` and the
`@sentry/deno` hook only transforms packages under a local `node_modules`.

Requires MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`) for the
`/db` route.

## Run

```
cd $REPRO/cells/M-hapi-deno

# viability without Sentry
deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys bare.ts

# sink (43117) + downstream recorder (43119)
PORT=43117 node sink.mjs > sink.log 2>&1 &
REC_PORT=43119 node recorder.mjs > recorder.log 2>&1 &

# the four variants; each starts the app on port 0, drives every route, dumps items-<label>.json
./probe.sh main-hook.ts         static B-hook-nojsonfix    # crashes at import, by design
./probe.sh main-nohook.ts       static A-nohook-static
./probe.sh main-nohook.ts       stream A-nohook-stream
./probe.sh main-hook-jsonfix.ts static C-hookfix-static
./probe.sh main-hook-jsonfix.ts stream C-hookfix-stream
```

`probe.sh` is the driver: it clears the sink, boots the app, then curls `/users/42`, `/error`,
`/db`, `/downstream`, `/downstream-http`, `/log`, `/users/9` with a `sentry-trace` header, three
concurrent `/iso/{tag}` requests and `/sentinel`, waits 8s for the log flush, and writes
`items-<label>.json` and `hits-<label>.json`. Driving from curl (a separate process) avoids the
not-sampled `sentry-trace` gotcha.

Run the app by hand instead of via `probe.sh` with:

```
LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main-hook-jsonfix.ts
```

Entry order matters: `@sentry/deno/import`, then `json-fix.mjs`, then `init.ts`, then `app-body.ts`.
The JSON fix must come after the hook so it sits first in the hook chain and `.json` never reaches
Deno's default loader. There is no `Sentry.setupHapiErrorHandler(server)` call: `@sentry/deno` on
develop does not export it, and `hapiIntegration` is already in `getDefaultIntegrations()`.

## Expected (recorded verdict)

| capability | verdict |
| --- | --- |
| errors | partial — event only with hook + JSON fix (`auto.function.hapi`, `handled: false`); without the hook the throw is lost |
| route names | partial — `GET /users/{id}` source `route` only with hook + fix; without it `GET /users/42` source `url` (stream: `http.server GET`) |
| isolation | works |
| incoming trace | works |
| outgoing fetch | broken — no `http.client` span, no `sentry-trace`/`baggage` (K2) |
| db spans | works — needs the hook + JSON fix |
| logs | works |

Recorded evidence lines:

```
--- B: import hook WITHOUT the JSON fix (main-hook.ts) — app never boots ---
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const Pkg = require('../package.json');
            ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at Object.<anonymous> (.../M-hapi-deno/node_modules/@hapi/validate/lib/common.js:6:13)

--- A: no hook, traceLifecycle static ---
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"15d7c1386f3c4b399b2278e0b99215af","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"f1e880e3272f4642902619c8b35121da","spans":[]}
    (no event for /error — the throw is lost)
{"type":"transaction","name":"GET /users/9","op":"http.server","source":"url","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"bbbbbbbbbbbbbbbb","spans":[]}
{"type":"event","exception":"iso beta","mechanism":"generic","handled":true,"tags":{"probe":"beta"},"trace_id":"7b3055ca983e4c24950ec0252dfbab19","transaction":"GET /iso/beta"}
{"type":"log","items":["info: hello from hapi on deno"]}
=== recorder === [{"url":"/api/downstream","sentryTrace":null,"baggage":null}]

--- A: no hook, traceLifecycle stream ---
{"type":"span","items":["http.server GET [src=- trace=57279817d8754fb8a186260f0952fdc4 parent=-]"]}
{"type":"span","items":["http.client GET 127.0.0.1 [...]","http.server GET [...]"]}

--- C: hook + JSON fix, traceLifecycle static ---
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","spans":["router GET /users/{id}"]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","spans":["router GET /error"]}
{"type":"event","exception":"hapi route boom","mechanism":"auto.function.hapi","handled":false,"sdk":"sentry.javascript.deno","transaction":"GET /error","hasContextLine":true}
```

## Observed on 2026-09-07

Rebuilt and rerun once on Deno 2.9.0, `@hapi/hapi` 21.4.10, SDK 10.67.0 tarballs. Every capability
matches the recorded verdict.

Viability without Sentry (`bare.ts`):

```
READY PORT=63437
{"id":"7","bare":true}
```

B — hook without the JSON fix (`app-B-hook-nojsonfix.log`), app never boots:

```
error: Uncaught (in promise) SyntaxError: Unexpected token ':'
const Pkg = require('../package.json');
            ^
    at Object.compileFunction (ext:core/01_core.js:1106:31)
    at wrapSafe (node:module:1666:21)
    at Module._compile (node:module:1691:23)
    at Object.<anonymous> (file:///.../cells/M-hapi-deno/node_modules/@hapi/validate/lib/common.js:6:13)
```

A — no hook, `traceLifecycle: static` (`items-A-nohook-static.json`):

```
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"6bf7f64051384b87b641941542f500e1","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"51a47a38bd8445da91cf80a12389cb3e","spans":[]}
    (no event for /error — the throw is lost)
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"a6a1b7e8fa1f4fcdb47ed6ca423a1641","spans":[]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"url","status":"ok","spans":[]}
{"type":"transaction","name":"GET /downstream-http","op":"http.server","source":"url","status":"ok","spans":["http.client GET http://127.0.0.1:43119/api/downstream-http"]}
{"type":"transaction","name":"GET /users/9","op":"http.server","source":"url","status":"ok","trace_id":"cccccccccccccccccccccccccccccccc","parent_span_id":"dddddddddddddddd","spans":[]}
{"type":"event","exception":"Error: iso alpha","mechanism":"generic","handled":true,"tags":{"probe":"alpha"},"trace_id":"605055b4b99740849abca5dd29b1e376","transaction":"GET /iso/alpha","hasContextLine":true}
{"type":"event","exception":"Error: iso beta","mechanism":"generic","handled":true,"tags":{"probe":"beta"},"trace_id":"0c2db11022f84ead8d2237c888cf4290","transaction":"GET /iso/beta","hasContextLine":true}
{"type":"event","exception":"Error: iso gamma","mechanism":"generic","handled":true,"tags":{"probe":"gamma"},"trace_id":"0d198f789d26472d9c446ff9422c4e36","transaction":"GET /iso/gamma","hasContextLine":true}
{"type":"log","items":["info: hello from hapi on deno"]}
```

A — no hook, `traceLifecycle: stream` (`items-A-nohook-stream.json`), method-only server span names:

```
span: http.server GET
span: http.client GET 127.0.0.1 | http.server GET
```

C — hook + JSON fix, `traceLifecycle: static` (`items-C-hookfix-static.json`):

```
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","trace_id":"3b7abc9c9ebd4c928285080c5ad471b7","spans":["router GET /users/{id}"]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"3f40600ad1f14e639f3d08f0c602fdab","spans":["router GET /error"]}
{"type":"event","exception":"Error: hapi route boom","mechanism":"auto.function.hapi","handled":false,"sdk":"sentry.javascript.deno","hasContextLine":true,"transaction":"GET /error","trace_id":"3f40600ad1f14e639f3d08f0c602fdab"}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["router GET /db","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","spans":["router GET /downstream"]}
{"type":"transaction","name":"GET /downstream-http","op":"http.server","source":"route","status":"ok","spans":["router GET /downstream-http","http.client GET http://127.0.0.1:43119/api/downstream-http"]}
{"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","trace_id":"cccccccccccccccccccccccccccccccc","parent_span_id":"dddddddddddddddd","spans":["router GET /users/{id}"]}
{"type":"log","items":["info: hello from hapi on deno"]}
```

C — hook + JSON fix, `traceLifecycle: stream` (`items-C-hookfix-stream.json`):

```
event: Error: hapi route boom auto.function.hapi handled=False GET /error
span: router /users/{id} | http.server GET /users/{id}
span: db SELECT users | router /db | http.server GET /db
span: router /downstream | http.server GET /downstream
span: http.client GET 127.0.0.1 | router /downstream-http | http.server GET /downstream-http
log: ['info: hello from hapi on deno']
```

Recorder, every run (`hits-*.json`) — `fetch()` sends nothing, `node:http.get()` propagates:

```
{"url":"/api/downstream","sentryTrace":null,"baggage":null}
{"url":"/api/downstream-http","sentryTrace":"107372d93ff446658252104ba5d90057-ab3e6dd38762eb5d-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=107372d93ff446658252104ba5d90057,sentry-transaction=GET%20%2Fdownstream-http,sentry-sampled=true,sentry-sample_rand=0.6719801608486775,sentry-sample_rate=1"}
```

Per-capability match:

- errors — **matches** (partial). Hook + fix: `auto.function.hapi`, `handled: false`, context line, both lifecycles. No hook: `GET /error` transaction with `internal_error` and no event.
- route names — **matches** (partial). Hook + fix: `GET /users/{id}` source `route` plus `router GET /users/{id}`; stream `http.server GET /users/{id}`. No hook: `GET /users/42` source `url`; stream `http.server GET`.
- isolation — **matches** (works). alpha/beta/gamma each carried only its own `probe` tag and its own trace id, in both the no-hook and hook+fix runs.
- incoming trace — **matches** (works). `trace_id cccccccccccccccccccccccccccccccc`, `parent_span_id dddddddddddddddd`, with and without the hook.
- outgoing fetch — **matches** (broken). `/downstream` span list carries only `router` + `http.server`; recorder saw `sentryTrace: null` on every `/api/downstream` hit.
- db spans — **matches** (works). `db SELECT id, name FROM users` (static) / `db SELECT users` (stream) with the hook; absent without it.
- logs — **matches** (works). `{"type":"log","items":["info: hello from hapi on deno"]}` in all four booting configurations.

Only difference from the record: none of substance. The trace ids and ports differ per run, and the
recorded `GET /users/9` line shows placeholder `aaaa…`/`bbbb…` ids where this run shows the actual
`cccc…`/`dddd…` values sent by the curl header.

## Files

- `main-nohook.ts`, `main-hook.ts`, `main-hook-jsonfix.ts` — the three entry variants
- `init.ts` — `Sentry.init` (dsn, tunnel to the sink, `tracesSampleRate: 1.0`, `traceLifecycle` from `LIFECYCLE`)
- `app-body.ts` — the Hapi server and all routes, module-scope `mysql` connection
- `json-fix.mjs` — the 12-line JSON load-hook workaround
- `bare.ts` — Hapi with no Sentry, the viability control
- `sink.mjs` — envelope sink, keeps trace ids, parent span id, tags, transaction, request url
- `recorder.mjs` — downstream target that records `sentry-trace` / `baggage`, `GET /__hits`
- `probe.sh` — the driver
- `items-*.json`, `hits-*.json`, `app-*.log` — the output of the 2026-09-07 run
