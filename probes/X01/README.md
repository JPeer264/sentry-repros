# X01 - Hono on Bun bundled: hono inlined vs external (K7)

Runtime: bun 1.4.2 (record: 1.4.0) | SDK: `@sentry/hono` 10.67.0 (develop line, tarballs in `_toolbox/pack/`) | hono 4.13.7 (record: 4.13.5)

## What it reproduces

A Hono app on Bun (`sentry(app, {...})` from `@sentry/hono/bun`, a parameterized route
`/hello/:name`, a throwing route `/error`, and a sub-app mounted at `/sub` with `/item/:id` and
`/boom`) is run three ways: unbundled with `bun app.ts`, as a `Bun.build` bundle with
`external: ["@sentry/*"]` so hono is inlined into the bundle, and as a bundle with
`external: ["@sentry/*", "hono"]` so hono stays in `node_modules`. The unbundled and fully-external
runs behave identically, but the bundle that inlines hono while keeping `@sentry/*` external takes
the whole app down: the external `@sentry/hono` resolves `matchedRoutes` from its own
`node_modules/hono` copy, that helper indexes `c.req` with a module-local `Symbol()` from
`hono/dist/request/constants.js`, and the bundle carries a *second* copy of that Symbol, so the
lookup returns `undefined` and Sentry's `requestHandler` throws before `next()` ever runs.

## Install

From this directory:

```
npm install --no-audit --no-fund
```

(`package.json` points every `@sentry/*` dependency at `../../_toolbox/pack/*.tgz`. `bun add` of the
same tarballs fails to resolve `@sentry/server-runtime-injection@10.67.0`; install with npm and run
with bun.)

## Run

From this directory, using sink port 41273 and app port 41274:

```
PORT=41273 node sink.mjs > sink.log 2>&1 & echo "sinkpid=$!" > .sinkpid
sleep 1
bun run build-inline.ts
bun run build-ext.ts
./run.sh unbundled 41274 41273
./run.sh inline    41274 41273
./run.sh ext       41274 41273
sinkpid=$(sed 's/sinkpid=//' .sinkpid); kill $sinkpid; wait $sinkpid
```

`run.sh <mode> <app port> <sink port>` clears the sink, starts the app with
`PORT`/`SINK`/`SENTRY_DEBUG=1` (`app.ts`, `dist-inline/app.js` or `dist-ext/app.js`), runs
`node ./drive.mjs <app port> <sink port>`, then kills the app. Per-mode output lands in
`drive-<mode>.log` (request statuses plus the sink dump) and `run-<mode>.log` (the app's own stdout,
where the inline crash stack shows up). `drive.mjs` drives the app from a plain `node` process so the
server spans are sampled, waits for the `sentinel` event and then a further 8 s, because develop's
stream-lifecycle span envelopes are flushed after the event and are lost if the process is killed
straight after the sentinel arrives.

## Expected

Recorded verdict: **partial**.

Unbundled `bun app.ts` and the bundle with `external: ["@sentry/*", "hono"]` both work:
route-parameterized span names (`GET /hello/:name`, `GET /sub/item/:id`) and both route errors (main
app and sub-app) captured with mechanism `auto.http.hono.context_error`. The bundle with only
`external: ["@sentry/*"]` (hono inlined) is broken: every request returns 500, no error event is
captured, and spans are named just `GET`.

Recorded evidence lines:

```
unbundled (bun run app.ts) and ext (external @sentry/* + hono), identical sink output:
{"type":"event","exception":"hono route error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":{"name":"bun","version":"1.4.0"},"hasContextLine":true}
{"type":"event","exception":"sub-app error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono",...}
{"type":"event","message":"sentinel",...}
{"type":"span","items":["http.server GET /hello/:name"]}
{"type":"span","items":["http.server GET /error"]}
{"type":"span","items":["http.server GET /sub/item/:id"]}
{"type":"span","items":["http.server GET /sub/boom"]}
{"type":"span","items":["http.server GET /sentinel"]}

inline (external @sentry/* only, hono bundled), drive output + sink:
/hello/world 500 Internal Server Error
/error 500 Internal Server Error
/sub/item/42 500 Internal Server Error
/sub/boom 500 Internal Server Error
/sentinel 500 Internal Server Error
{"type":"span","items":["http.server GET"]}  (x6, no event items at all)

run-inline.log (per request):
TypeError: undefined is not an object (evaluating 'c.req[GET_MATCH_RESULT][0]')
      at matchedRoutes (.../develop/node_modules/hono/dist/helper/route/index.js:6:9)
      at resolveRouteName (.../node_modules/@sentry/hono/build/esm/shared/resolveRouteName.js:8:18)
      at updateSpanRouteName (.../node_modules/@sentry/hono/build/esm/shared/middlewareHandlers.js:58:17)
      at requestHandler (.../node_modules/@sentry/hono/build/esm/shared/middlewareHandlers.js:9:3)
      at <anonymous> (.../node_modules/@sentry/hono/build/esm/bun/middleware.js:12:5)

dist-inline/app.js:49: var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();   (second copy next to node_modules/hono/dist/request/constants.js)
```

## Observed on 2026-09-07 (rebuild run)

Matches the recorded verdict (**partial**), in all three modes.

`drive-unbundled.log` and `drive-ext.log`, trimmed (the two are identical apart from trace ids):

```
/hello/world 200 OK
/error 500 Internal Server Error
/sub/item/42 200 OK
/sub/boom 500 Internal Server Error
/sentinel 200 OK
{"type":"event","exception":"Error: hono route error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":"bun","hasContextLine":true,"transaction":"GET /error",...}
{"type":"event","exception":"Error: sub-app error","mechanism":"auto.http.hono.context_error","handled":false,"sdk":"sentry.javascript.hono","runtime":"bun","hasContextLine":true,"transaction":"GET /sub/boom",...}
{"type":"event","message":"sentinel","exception":"undefined: sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.hono",...}
{"type":"span","items":["http.server GET /hello/:name"],"raw":[{"name":"GET /hello/:name","status":"ok","is_segment":true,"origin":"auto.http.bun.serve"}]}
{"type":"span","items":["http.server GET /error"],"raw":[{"name":"GET /error","status":"error",...}]}
{"type":"span","items":["http.server GET /sub/item/:id"],"raw":[{"name":"GET /sub/item/:id","status":"ok",...}]}
{"type":"span","items":["http.server GET /sub/boom"],"raw":[{"name":"GET /sub/boom","status":"error",...}]}
{"type":"span","items":["http.server GET /sentinel"],"raw":[{"name":"GET /sentinel","status":"ok",...}]}
```

`drive-inline.log`, trimmed:

```
/hello/world 500 Internal Server Error
/error 500 Internal Server Error
/sub/item/42 500 Internal Server Error
/sub/boom 500 Internal Server Error
/sentinel 500 Internal Server Error
{"type":"span","items":["http.server GET"],"raw":[{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.bun.serve"}]}
{"type":"span","items":["http.server GET"],...}
{"type":"span","items":["http.server GET"],...}
{"type":"span","items":["http.server GET"],...}
{"type":"span","items":["http.server GET"],...}
```

No `event` items at all in the inline run.

`run-inline.log`, per request:

```
TypeError: undefined is not an object (evaluating 'c.req[GET_MATCH_RESULT][0]')
      at matchedRoutes ($REPRO/probes/X01/node_modules/hono/dist/helper/route/index.js:6:9)
      at resolveRouteName ($REPRO/probes/X01/node_modules/@sentry/hono/build/esm/shared/resolveRouteName.js:8:18)
      at updateSpanRouteName ($REPRO/probes/X01/node_modules/@sentry/hono/build/esm/shared/middlewareHandlers.js:58:17)
      at requestHandler ($REPRO/probes/X01/node_modules/@sentry/hono/build/esm/shared/middlewareHandlers.js:9:3)
      at <anonymous> ($REPRO/probes/X01/node_modules/@sentry/hono/build/esm/bun/middleware.js:12:5)
      at dispatch ($REPRO/probes/X01/node_modules/hono/dist/compose.js:22:23)
```

`dist-inline/app.js`, same line number as recorded:

```
49:var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
```

The recorded "No available Node API to register diagnostics-channel injection hooks; skipping."
warning is present in `run-unbundled.log`.

Differences from the record, none of them behavioural:

- Bun is 1.4.2 on this machine now, the record ran on 1.4.0. Same failure, same stack.
- hono resolved to 4.13.7 here, the record says 4.13.5. Same failure, same bundle line.
- The sink's compact `exception` field carries the `Error: ` type prefix (`Error: hono route error`)
  and `runtime` is the bare string `bun`; the record's evidence was written from a sink whose
  mapping printed the value only and the runtime as `{name, version}`.
- The inline run produced 5 span envelopes, not the recorded 6 (5 requests, one segment span each);
  the record's "x6" looks like an extra envelope from a warm-up request in the original run.
- Paths are this directory instead of the original scratchpad `deep/X01/develop/`.

## Files

- `app.ts` - the Hono app (main routes + sub-app + sentinel route)
- `build-inline.ts` - `Bun.build` with `external: ["@sentry/*"]` (hono inlined) into `dist-inline/`
- `build-ext.ts` - `Bun.build` with `external: ["@sentry/*", "hono"]` into `dist-ext/`
- `drive.mjs` - plain-node driver; hits the five routes, waits for the sentinel, dumps the sink
- `run.sh` - per-mode runner
- `sink.mjs` - unmodified `_toolbox/sink.mjs`
- `drive-{unbundled,inline,ext}.log`, `run-{unbundled,inline,ext}.log`, `sink.log` - output of the run above
- `dist-inline/`, `dist-ext/` - the two bundles from the run above (they still need `node_modules`
  for the external `@sentry/*`, so reinstall before rerunning)
