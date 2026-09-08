# M-solidstart-bun

SolidStart 2 (`@solidjs/start` 2.0.2 + `nitro` 3.0.260610-beta + vite 8) served by **bun** from the
nitro node output, instrumented with the `develop` Sentry SDK (v11 line, package version 10.67.0).

## What it reproduces

SolidStart 2 builds a plain nitro node output and `bun .output/server/index.mjs` serves it fine, and
`Sentry.init()` inside a nitro plugin succeeds under bun, so transactions, spans and logs are
delivered. But the nitro output bundles srvx's **node** adapter, so the server is `node:http`-shaped,
and `@sentry/node`'s `node:http` server instrumentation has no effect under bun. That one layer is
what forks the isolation scope and calls `continueTrace`, so on bun there is no per-request
isolation, no per-request trace id and no incoming trace continuation; `@sentry/nitro`'s own srvx/h3
tracing channels do fire (span nesting inside a request is correct) but they only start spans.
Independently, `module.registerHooks` is unavailable on bun, so the SDK logs
`No available Node API to register diagnostics-channel injection hooks; skipping` and externalized
deps like `mysql2` are never instrumented, and bun's native `fetch` is never reached by the node
SDK's fetch instrumentation. Net effect: errors and route names are partial, logs work, and
isolation, incoming trace, outgoing fetch and db spans are all dead.

## Install

```
cd app && npm install --legacy-peer-deps --no-audit --no-fund
```

(The SDK tarballs are referenced as `file:../../../_toolbox/pack/sentry-*-10.67.0.tgz`, so no
separate tarball command line is needed. `--legacy-peer-deps` is required because
`@sentry/nitro@10.67.0` pins `nitro@">=3.0.0-0 <4.0.0 || 3.0.260311-beta || 3.0.260415-beta"`, which
semver prerelease rules do not let `nitro@3.0.260610-beta` satisfy.)

`app/.output/` is committed (2.3 MB), so the app runs without a rebuild. To rebuild:
`cd app && npx vite build` (build under node, run under bun).

## Run

```
# 1. envelope sink (extended: adds /__recorder and /__hits to the standard compact sink)
cd <this dir> && PORT=52311 node sink2.mjs > sink.log 2>&1 &

# 2. app under bun
cd app && SENTRY_TUNNEL=http://127.0.0.1:52311/ SENTRY_LIFECYCLE=static PORT=52318 bun .output/server/index.mjs &

# 3. probes (drive from curl, a separate process, to avoid the sampling gotcha)
curl -s -X DELETE http://127.0.0.1:52311/__items
curl -s -o /dev/null http://127.0.0.1:52318/api/boom                      # plain throw in a file API route
curl -s -o /dev/null http://127.0.0.1:52318/server-error                  # withServerActionInstrumentation throw
curl -s -o /dev/null http://127.0.0.1:52318/users/456                     # parameterized page route
curl -s -o /dev/null http://127.0.0.1:52318/api/users/789                 # parameterized API route
curl -s -H "sentry-trace: 12345678901234567890123456789012-1234567890abcdef-1" \
     -H "baggage: sentry-trace_id=12345678901234567890123456789012,sentry-environment=upstream,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" \
     -o /dev/null http://127.0.0.1:52318/api/hello
curl -s "http://127.0.0.1:52318/api/fetchout?target=http%3A%2F%2F127.0.0.1%3A52311%2F__recorder"
curl -s -o /dev/null http://127.0.0.1:52318/api/db
curl -s -o /dev/null http://127.0.0.1:52318/api/log
( curl -s "http://127.0.0.1:52318/api/iso?tag=alpha" & curl -s "http://127.0.0.1:52318/api/iso?tag=beta" & curl -s "http://127.0.0.1:52318/api/iso?tag=gamma" & wait )
curl -s -o /dev/null http://127.0.0.1:52318/api/sentinel                  # sentinel: captureMessage + flush
sleep 8 && curl -s http://127.0.0.1:52311/__items                         # 8s only because logs flush on a timer
curl -s http://127.0.0.1:52311/__hits                                     # headers the outgoing fetch carried

# optional: the debug startup that prints the injection-hook line
SENTRY_TUNNEL=http://127.0.0.1:52311/ SENTRY_DEBUG=1 PORT=52316 bun .output/server/index.mjs
```

Needs MariaDB on `127.0.0.1:3307` (root, no password, db `app`, table `users(id, name)`) for `/api/db`.

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | partial |
| route names | partial |
| isolation | broken |
| incoming trace | broken |
| outgoing fetch | broken |
| db spans | broken |
| logs | works |
| client errors | not-run (out of scope, curl only, client SDK never mounted) |

Recorded evidence lines (bun, `traceLifecycle: 'static'`):

```
{"type":"transaction","name":"GET /api/boom","op":"http.server","source":"url","status":"internal_error","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","spans":["middleware GET /api/boom","http.server GET /api/boom"]}
{"type":"event","exception":"probe-server-action-error","mechanism":"auto.function.solidstart","handled":false,"sdk":"sentry.javascript.solidstart","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","span_id":"af55f83ab65a05b9","runtime":"node","hasContextLine":true}
{"type":"transaction","name":"GET /server-error","op":"http.server","source":"url","status":"internal_error","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","spans":["middleware GET /server-error","http.server GET /server-error","function boomAction"]}
{"type":"transaction","name":"GET /users/456","op":"http.server","source":"url","status":"ok","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","spans":["middleware GET /users/456","http.server GET /users/456","function getUser"]}
{"type":"transaction","name":"GET /api/hello","op":"http.server","source":"url","status":"ok","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","spans":["middleware GET /api/hello","http.server GET /api/hello"]}     <-- carried sentry-trace ...; no parent_span_id, trace id unchanged
{"type":"transaction","name":"GET /api/fetchout","op":"http.server","source":"url","status":"ok","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","spans":["middleware GET /api/fetchout","http.server GET /api/fetchout"]}     <-- no http.client child
{"type":"transaction","name":"GET /api/db","op":"http.server","source":"url","status":"ok","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","spans":["middleware GET /api/db","http.server GET /api/db"]}     <-- no db child
{"type":"log","items":["info: probe-log-from-handler"]}
{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.solidstart","trace_id":"f16c0394eeec4d69955ed66bf95a2d9a","span_id":"9492d7c02bdc6bab","runtime":"node","hasContextLine":true}

recorder saw, for the fetchout request on bun:
{"recorder":true,"headers":{"sentry-trace":null,"baggage":null}}

=== bun isolation probe: 3 concurrent /api/iso?tag=... ===
{"tag":"gamma","traceId":"b50f8a470d9a4d4888e6b2f9d62fedb6"}{"tag":"beta","traceId":"b50f8a470d9a4d4888e6b2f9d62fedb6"}{"tag":"alpha","traceId":"b50f8a470d9a4d4888e6b2f9d62fedb6"}
{"type":"event","exception":"iso-error-gamma","mechanism":"generic","handled":true,"tags":{"probe_tag":"gamma"},"trace_id":"b50f8a470d9a4d4888e6b2f9d62fedb6",...}
{"type":"event","exception":"iso-error-beta","mechanism":"generic","handled":true,"tags":{"probe_tag":"gamma"},"trace_id":"b50f8a470d9a4d4888e6b2f9d62fedb6",...}
```

Startup line on bun:

```
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
```

## Observed on 2026-09-07

Reproduces. Every recorded verdict holds. Full sink dump in `observed-items.txt`.

```
{"type": "transaction", "name": "GET /api/boom", "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /api/boom", "http.server GET /api/boom"]}
{"type": "event", "exception": "Error: probe-server-action-error", "mechanism": "auto.function.solidstart", "handled": false, "sdk": "sentry.javascript.solidstart", "runtime": "node", "hasContextLine": true, "trace_id": "d182976216634b7eb418886a9dd3e98b"}
{"type": "transaction", "name": "GET /server-error", "op": "http.server", "source": "url", "status": "internal_error", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /server-error", "http.server GET /server-error", "function boomAction"]}
{"type": "transaction", "name": "GET /users/456", "op": "http.server", "source": "url", "status": "ok", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /users/456", "http.server GET /users/456", "function getUser"]}
{"type": "transaction", "name": "GET /api/users/789", "op": "http.server", "source": "url", "status": "ok", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /api/users/789", "http.server GET /api/users/789"]}
{"type": "transaction", "name": "GET /api/hello", "op": "http.server", "source": "url", "status": "ok", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /api/hello", "http.server GET /api/hello"]}
{"type": "transaction", "name": "GET /api/fetchout", "op": "http.server", "source": "url", "status": "ok", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /api/fetchout", "http.server GET /api/fetchout"]}
{"type": "transaction", "name": "GET /api/db", "op": "http.server", "source": "url", "status": "ok", "trace_id": "d182976216634b7eb418886a9dd3e98b", "spans": ["middleware GET /api/db", "http.server GET /api/db"]}
{"type": "log", "items": ["info: probe-log-from-handler"]}
{"type": "event", "exception": "Error: iso-error-gamma", "mechanism": "generic", "handled": true, "hasContextLine": true, "trace_id": "d182976216634b7eb418886a9dd3e98b", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-error-beta", "mechanism": "generic", "handled": true, "hasContextLine": true, "trace_id": "d182976216634b7eb418886a9dd3e98b", "tags": {"probe_tag": "alpha"}}
{"type": "event", "exception": "Error: iso-error-alpha", "mechanism": "generic", "handled": true, "hasContextLine": true, "trace_id": "d182976216634b7eb418886a9dd3e98b", "tags": {"probe_tag": "alpha"}}
{"type": "event", "message": "sentinel", "mechanism": "generic", "handled": true, "trace_id": "d182976216634b7eb418886a9dd3e98b", "tags": {"probe_tag": "alpha"}}
```

Response bodies of the three concurrent isolation requests:

```
{"tag":"gamma","traceId":"d182976216634b7eb418886a9dd3e98b"}{"tag":"beta","traceId":"d182976216634b7eb418886a9dd3e98b"}{"tag":"alpha","traceId":"d182976216634b7eb418886a9dd3e98b"}
```

Outgoing fetch, response body and recorder hits:

```
{"recorder":true,"headers":{"sentry-trace":null,"baggage":null}}
[{"url":"/__recorder","sentry-trace":null,"baggage":null}]
```

Startup line on bun:

```
Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
```

Per capability:

- **errors — partial, matches.** `/server-error` produced the `auto.function.solidstart`,
  `handled: false` event with context lines, on the `GET /server-error` transaction. The plain
  `throw` in `src/routes/api/boom.ts` produced a 500 and an `internal_error` transaction but **no
  event** at all.
- **route names — partial, matches.** `GET /users/456` and `GET /api/users/789`, both
  `source: "url"`; never a parameterized name.
- **isolation — broken, matches.** All three concurrent `/api/iso` requests returned the same trace
  id `d182976216634b7eb418886a9dd3e98b`, all three events carry one tag (`probe_tag: alpha`), and
  that stale tag leaked into the later unrelated sentinel event. Every request in the process, before
  and after, used that same trace id.
- **incoming trace — broken, matches.** The request carrying
  `sentry-trace: 12345678901234567890123456789012-...` produced `GET /api/hello` on the
  process-global trace id, no `parent_span_id`, trace id unchanged.
- **outgoing fetch — broken, matches.** No `http.client` child on `GET /api/fetchout`, and the
  recorder saw `sentry-trace: null, baggage: null`.
- **db spans — broken, matches.** `/api/db` returned `[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]`
  from the module-scope `mysql2/promise` pool with no db span on the transaction.
- **logs — works, matches.** `{"type": "log", "items": ["info: probe-log-from-handler"]}` after the
  8 s timer flush.
- **client errors — not-run, matches.** Curl only; the client SDK was never mounted.

### Differences from the record

- The isolation winner is a different tag: the record's three requests all reported `probe_tag:
  gamma`, this run's all reported `probe_tag: alpha`. Same defect (one scope shared by all
  concurrent requests), nondeterministic winner.
- bun on this machine is now **1.4.2**, not the recorded 1.4.0. No behavioral difference observed.
- The node contrast run in the record (`node .output/server/index.mjs` on the same build, which
  recorded three distinct trace ids, `http.client GET .../__recorder` with headers, and
  `db mysql2.pool.connect` / `db SELECT id, name FROM users`) could **not** be reproduced here: under
  node v26.5.0 the process exits immediately with an empty log and never listens. Two attempts,
  recorded as not-run; it is contrast evidence only and does not affect any bun verdict.
