# M-hono-deno

Hono 4.13.7 with `@sentry/hono/deno` 10.67.0 (develop, `6f2da7483d`) on Deno 2.9.0.

## What it reproduces

A Hono app served by `Deno.serve`, instrumented with the `sentry(app, options)` middleware from
`@sentry/hono/deno`, exercising the seven capabilities of the framework matrix: errors, route names,
request isolation, incoming trace continuation, outgoing `fetch`, database spans and logs. Six of the
seven work; the one hole is **outgoing `fetch`**, which produces no `http.client` span and, worse,
sends no `sentry-trace`/`baggage` headers, so a distributed trace breaks silently at the first hop.
`node:http` from the same handler propagates both, which places the gap in Deno's `fetch` patching
rather than in Hono. A second, documentation-shaped finding: database spans exist only when
`import "@sentry/deno/import";` is the first line of the entry and `deno.json` sets `nodeModulesDir`,
so the SDK's Deno import hook can transform the driver under a real local `node_modules`.

Files: `main.ts` (the app, hook on), `main-nohook.ts` (identical minus the first line, the db-span
control), `plain.ts` (Hono without Sentry, viability check), `sink2.mjs` (the envelope sink from
`_toolbox` extended with trace/span ids, tags, `http.route`, a richer span-item shape and a `/rec/*`
endpoint that records incoming downstream request headers).

`observed-*.json` are the sink dumps quoted under "Observed" below. `*.log` are the stdout of each
run; `sink.log` holds an `EADDRINUSE` from a smoke run started while the previous sink still held the
port, which is noise from the rerun, not part of the result (`sink-smoke.log` is the clean one).
`app-body.txt` is the shared body that `main.ts` and `main-nohook.ts` were generated from and is
byte-identical to `main-nohook.ts`.

## Install

```
cd $REPRO/cells/M-hono-deno && npm install
```

`package.json` pins the five SDK tarballs by relative path under `_toolbox/pack`
(`@sentry/{deno,hono,core,server-utils,server-runtime-injection}` at 10.67.0) plus `hono@4` and
`mysql@2`, so a bare `npm install` restores `node_modules`. MariaDB must be reachable on
`127.0.0.1:3307` (user `root`, no password, database `app`, table `users`).

## Run

```
cd $REPRO/cells/M-hono-deno

# sink + downstream header recorder on 52817
PORT=52817 node sink2.mjs > sink.log 2>&1 &

# viability, no Sentry
APP_PORT=52818 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys plain.ts &
curl -s http://127.0.0.1:52818/users/42        # -> {"id":"42"}

# app, static lifecycle (transaction envelopes with nested spans[])
APP_PORT=52818 SINK_PORT=52817 LIFECYCLE=static \
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys main.ts &

# drive, from plain curl so no client-side sentry-trace pollutes sampling
B=http://127.0.0.1:52818
curl -s $B/users/42
curl -s $B/error
curl -s $B/downstream
curl -s $B/downstream-http
curl -s $B/db
curl -s $B/log
TID=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
curl -s -H "sentry-trace: $TID-bbbbbbbbbbbbbbbb-1" \
        -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" \
        $B/users/7
curl -s $B/tag/alpha & curl -s $B/tag/beta & curl -s $B/tag/gamma & wait
curl -s "$B/sentinel?n=1"                      # sentinel; read the sink once it appears

# read
curl -s http://127.0.0.1:52817/__items
curl -s http://127.0.0.1:52817/__reqs
curl -s -X DELETE http://127.0.0.1:52817/__items

# app, default stream lifecycle: drop LIFECYCLE=static
# db-span control without the import hook: run main-nohook.ts instead of main.ts
```

## Expected

Recorded verdicts:

| capability | verdict |
| --- | --- |
| errors | works |
| route names | works |
| isolation | works |
| incoming trace | works |
| outgoing fetch | **broken** |
| db spans | works (needs `import "@sentry/deno/import";`) |
| logs | works |

Recorded evidence lines:

```
--- static lifecycle (traceLifecycle: 'static'), hook ON ---
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"3b1f5bc415114b1098184ac0a1bf39cd","http_route":"/users/:id","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"0189dca030984ee48230ffc4fdf74199","http_route":"/error","spans":[]}
{"type":"event","exception":"hono deno boom","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","transaction":"GET /error","trace_id":"0189dca030984ee48230ffc4fdf74199","hasContextLine":true}
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"f1ca43a0f2274376afa6ce5ee1a966b9","http_route":"/db","spans":["db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","status":"ok","trace_id":"cc05933843ed42da88ef963ff312f3fd","http_route":"/downstream","spans":[]}
{"type":"log","items":["info: hello from hono deno"]}

--- incoming trace + isolation (static, hook ON) ---
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","span_id":"aa5bbe6c25c0e9c1","parent_span_id":"bbbbbbbbbbbbbbbb","http_route":"/users/:id","spans":[]}
{"type":"event","exception":"tagged alpha","mechanism":"generic","handled":true,"transaction":"GET /tag/:t","tags":{"reqtag":"alpha"},"trace_id":"1f18949d9a2f447cbbe6cb24e7dba709"}
{"type":"event","exception":"tagged beta","mechanism":"generic","handled":true,"transaction":"GET /tag/:t","tags":{"reqtag":"beta"},"trace_id":"41f3dbeae3c74854a387bb30f19d9159"}
{"type":"event","exception":"tagged gamma","mechanism":"generic","handled":true,"transaction":"GET /tag/:t","tags":{"reqtag":"gamma"},"trace_id":"634ed449e9b84dc9aa4a3d417b69db77"}

--- default stream lifecycle, hook ON ---
{"type":"span","items":[{"n":"http.server GET /users/:id","trace_id":"51ba99255f6f47938bb1ae6d82cc9fac","source":"route","route":"/users/:id","seg":"GET /users/:id"}]}
{"type":"span","items":[{"n":"db SELECT users","trace_id":"46695dc9dd30473cade26885661d0be3","parent_span_id":"a504a683e686c258","seg":"GET /db"},{"n":"http.server GET /db","trace_id":"46695dc9dd30473cade26885661d0be3","span_id":"a504a683e686c258","source":"route","route":"/db","seg":"GET /db"}]}
{"type":"span","items":[{"n":"http.server GET /downstream","trace_id":"bac0f6582949416db89f104f134ab9e2","source":"route","route":"/downstream","seg":"GET /downstream"}]}
```

## Observed on 2026-09-07

Rebuilt and run once. **All seven capabilities match the record**, including the `fetch` hole.
Trace ids differ per run, as they must.

Static lifecycle, hook ON (`observed-static-items.json`):

```
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "c6a176f8910543f7841582fb6d36939f", "span_id": "b0c910b4399cd570", "sdk": "sentry.javascript.hono", "http_route": "/users/:id", "spans": []}
{"type": "transaction", "name": "GET /error", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "9ebf99eb42564d89ae48598c95355b7d", "span_id": "a08fb5dea76e2524", "sdk": "sentry.javascript.hono", "http_route": "/error", "spans": []}
{"type": "event", "exception": "Error: hono deno boom", "mechanism": "auto.http.hono.context_error", "handled": false, "sdk": "sentry.javascript.hono", "transaction": "GET /error", "trace_id": "9ebf99eb42564d89ae48598c95355b7d", "hasContextLine": true}
{"type": "transaction", "name": "GET /downstream", "op": "http.server", "source": "route", "status": "ok", "trace_id": "294354b1fbbb4bcabf44ec246de56dbb", "span_id": "9e3f71dd8fc053fa", "sdk": "sentry.javascript.hono", "http_route": "/downstream", "spans": []}
{"type": "transaction", "name": "GET /downstream-http", "op": "http.server", "source": "route", "status": "ok", "trace_id": "3fdc1ab3d24d4822920c25c1c7413ee0", "span_id": "936b381994ffb2f2", "sdk": "sentry.javascript.hono", "http_route": "/downstream-http", "spans": ["http.client GET http://127.0.0.1:52817/rec/downstream-http"]}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "652592ee1b9b4866a57287e40671df0c", "span_id": "bc121a3e72dd55de", "sdk": "sentry.javascript.hono", "http_route": "/db", "spans": ["db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "span_id": "bb268f48a5d00b12", "parent_span_id": "bbbbbbbbbbbbbbbb", "sdk": "sentry.javascript.hono", "http_route": "/users/:id", "spans": []}
{"type": "event", "exception": "Error: tagged alpha", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.hono", "transaction": "GET /tag/:t", "tags": {"reqtag": "alpha"}, "trace_id": "31418e2cbe784a2285f3546809afdc4a", "hasContextLine": true}
{"type": "event", "exception": "Error: tagged beta", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.hono", "transaction": "GET /tag/:t", "tags": {"reqtag": "beta"}, "trace_id": "29b5836fb81e4e4aa4555103971d86e2", "hasContextLine": true}
{"type": "event", "exception": "Error: tagged gamma", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.hono", "transaction": "GET /tag/:t", "tags": {"reqtag": "gamma"}, "trace_id": "356ed57e9da840a986d1c8fd890214e9", "hasContextLine": true}
{"type": "log", "items": ["info: hello from hono deno"]}
```

Downstream header recorder (`observed-static-reqs.json`) — the whole `fetch` finding in two rows:

```
{"url": "/rec/downstream-fetch", "method": "GET", "sentryTrace": null, "baggage": null, "traceparent": null}
{"url": "/rec/downstream-http", "method": "GET", "sentryTrace": "3fdc1ab3d24d4822920c25c1c7413ee0-bd09b45c5821f816-1", "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=3fdc1ab3d24d4822920c25c1c7413ee0,sentry-transaction=GET%20%2Fdownstream-http,sentry-sampled=true,sentry-sample_rand=0.5795274909044287,sentry-sample_rate=1"}
```

Default stream lifecycle, hook ON (`observed-stream-items.json`):

```
{"type": "span", "items": [{"n": "http.server GET /users/:id", "trace_id": "015370f54b6445ac8822d3f1637d8335", "span_id": "ac650d86ea573491", "source": "route", "route": "/users/:id", "seg": "GET /users/:id"}]}
{"type": "span", "items": [{"n": "db SELECT users", "trace_id": "3a36f4a79d924d42b6cf408ca9819fde", "span_id": "83604ca7fb7cd74a", "parent_span_id": "b40defe003ba2f88", "seg": "GET /db"}, {"n": "http.server GET /db", "trace_id": "3a36f4a79d924d42b6cf408ca9819fde", "span_id": "b40defe003ba2f88", "source": "route", "route": "/db", "seg": "GET /db"}]}
{"type": "span", "items": [{"n": "http.server GET /downstream", "trace_id": "2efd5e7a89e445fc8212907766f4c352", "span_id": "b50bc63618fac766", "source": "route", "route": "/downstream", "seg": "GET /downstream"}]}
```

Control without `import "@sentry/deno/import";` (`main-nohook.ts`, `observed-nohook-items.json`) —
the db span is gone, confirming the hook dependency:

```
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "trace_id": "a2bbbab94f5d49b2961ce20865cd7ed7", "span_id": "a9d411614dd5ece9", "sdk": "sentry.javascript.hono", "http_route": "/db", "spans": []}
```

Per-capability comparison:

- **errors** — matches. Mechanism `auto.http.hono.context_error`, `handled:false`, context lines, `transaction: "GET /error"`, `sdk: sentry.javascript.hono`; Hono returns 500 and the process survives.
- **route names** — matches. `GET /users/:id` with `source: "route"` and `http.route: "/users/:id"` in static, and the same parameterized name plus `sentry.segment.name.source: route` on the `http.server` span in stream.
- **isolation** — matches. Three concurrent `/tag/*` requests produced three events with exactly one tag each and three distinct trace ids, no cross-talk.
- **incoming trace** — matches. `trace_id: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, `parent_span_id: bbbbbbbbbbbbbbbb`.
- **outgoing fetch** — matches the recorded **broken**. `/downstream` has `spans: []` in static and a lone `http.server` span in stream; the recorder saw no `sentry-trace` and no `baggage`. `node:http` from `/downstream-http` in the same app got both.
- **db spans** — matches. `db SELECT id, name FROM users` in static, `db SELECT users` parented to the `http.server` span in stream, and nothing at all without the import hook.
- **logs** — matches. `info: hello from hono deno`. It arrived within a second of the sentinel here rather than the recorded ~8s, which is flush timing, not a behavior difference.
