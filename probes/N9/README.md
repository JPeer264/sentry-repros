# N9 - Fresh 2 on Deno

Runtime: deno 2.9.0 | Framework: Fresh 2.3.3 (Vite-based) | SDK: `@sentry/deno` 10.67.0 (develop
line, tarballs in `_toolbox/pack/`)

## What it reproduces

A stock `jsr:@fresh/init@^2` scaffold (Fresh 2.3.3, the Vite variant) with the eight Sentry lines
prepended to `main.ts` - `import "@sentry/deno/import";`, `import * as Sentry from "@sentry/deno";`
and a `Sentry.init` pointed at a local envelope sink - is driven through six requests
(`/`, `/api/data`, `/boom`, `/api2/bob`, `/api/alice`, `/sentinel`) in the built production shape
(`deno task build` then `deno serve -A _fresh/server.js`). It shows that Fresh 2 boots and serves
fine under the SDK (K3, the `require('*.json')` crash that kills Express/Hapi/Fastify on Deno, does
not bite Fresh), but that the two things a Fresh user most needs are missing: an error thrown in a
route handler is swallowed by Fresh's own 500 renderer and never reaches Sentry, and server spans
are named by HTTP method only, with no path and no Fresh route pattern, so `/api/alice` and
`/api/bob` are indistinguishable. The probe also runs the same app with the import hook commented
out (identical output, no boot error) and with a four-line try/catch middleware registered right
after `app.use(staticFiles())` (the error is then captured, with source context). `routes/api/data.tsx`
fetches a local echo server so the missing outgoing-`fetch` client span (K2) is visible too.

## Install

From this directory:

```
./install.sh
```

That is `deno install` (Fresh, preact, vite - `deno.json` sets `nodeModulesDir: "manual"`), then
`npm --prefix sdk install --no-audit --no-fund` which pulls the four develop tarballs
(`sentry-{deno,core,server-utils,server-runtime-injection}-10.67.0.tgz` from `../../_toolbox/pack/`)
into `sdk/node_modules`, then symlinks `node_modules/@sentry/*` at them. `deno.json` maps
`"@sentry/deno": "npm:@sentry/deno"` with **no version**, otherwise Deno downloads the published
10.67.0 from the registry instead of using the local tree.

## Run

From this directory. Ports 41339 (sink), 41338 (echo), 41504 (prod app) and 41503 (vite dev) are the
defaults baked into `run.sh`; check they are free first
(`lsof -nP -iTCP:41339 -iTCP:41338 -iTCP:41504 -iTCP:41503`) and override with
`SINK_PORT=`/`ECHO_PORT=`/`APP_PORT=`/`DEV_PORT=` if not.

```
./run.sh
```

`run.sh` starts the sink (`PORT=41339 node sink.mjs`) and the echo server
(`PORT=41338 node echo.mjs`), builds if `_fresh/server.js` is missing, then runs three variants and
writes one items file each, polling `/__items` for the `sentinel` envelope before every read:

1. `deno serve -A --port 41504 _fresh/server.js` + the six requests -> `prod.log`, `items-prod.json`
2. the same with `N9_WORKAROUND=1` (enables the try/catch middleware) + `/boom`, `/sentinel` ->
   `prod-workaround.log`, `items-prod-workaround.json`
3. `deno task dev --port 41503` with line 1 of `main.ts` commented out + `/`, `/boom`, `/api/alice`,
   `/sentinel` -> `dev-nohook.log`, `items-dev-nohook.json`; `main.ts` is restored afterwards

It kills every process it started. The build alone is `deno task build` (`> build.log`), and the dev
server with the hook in place is `SINK_PORT=41339 ECHO_PORT=41338 deno task dev --port 41503`
(`dev.log` here is such a run). Note that `deno task start --port N` passes `--port` to the script
rather than to `deno serve` and silently listens on 8000; use `deno serve -A --port N _fresh/server.js`.

## Expected

Recorded verdict: **partial**.

Fresh 2.3.3 boots fine with `import "@sentry/deno/import"` as the first line of `main.ts`, in both
`vite` dev and the built `deno serve -A _fresh/server.js` production shape. K3 does NOT bite Fresh:
no boot error at all, and removing the hook line changes nothing. What is missing is the two things
a Fresh user most needs: (1) errors thrown in a Fresh route handler are swallowed by Fresh's own 500
renderer and NEVER reach Sentry - the sink shows only a span and no `event`; (2) server spans are
named `GET` (method only) with no path and no Fresh route pattern, so `/api/[name].tsx` hits are
indistinguishable. Fresh 2 already instruments `renderRoute` through `@opentelemetry/api`, but
`@sentry/deno` registers no TracerProvider so those spans hit `NoopTracer` and are discarded.
Outgoing `fetch` from a route produced no client span (K2 holds). A 4-line try/catch middleware
registered right after `app.use(staticFiles())` does capture the route error correctly, with source
context - that is the workaround the guide would have to document.

Recorded evidence lines - `deno serve` production build, 6 requests, sink 41339:

```
[{"type":"event","message":"sentinel","exception":"sentinel","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"},"hasContextLine":true},
 {"type":"span","items":["http.server GET /"]},
 {"type":"span","items":["http.server GET"]},
 {"type":"span","items":["http.server GET"]},
 {"type":"span","items":["http.server GET"]},
 {"type":"span","items":["http.server GET"]},
 {"type":"span","items":["http.server GET"]}]
Note: GET /boom returned 500 and there is NO event for it - only a span. `GET /` keeps its path
(static route, low-cardinality naming); every other route, including the dynamic `/api/[name]`,
collapses to bare `GET`.
```

Why the throw never reaches Sentry, and proof Fresh's own OTel spans are dropped (recorded `dev.log`):

```
GET http://127.0.0.1:41503/boom
Error: fresh route boom
    at GET (.../develop/app/routes/boom.tsx:8:11)
    at eval ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/segments.ts:140:20)
    at NoopContextManager.with (.../node_modules/.deno/@opentelemetry+api@1.9.1/.../NoopContextManager.js:38:15)
    at NoopTracer.startActiveSpan (.../@opentelemetry/api/build/src/trace/NoopTracer.js:79:27)
    at ProxyTracer.startActiveSpan (.../@opentelemetry/api/build/src/trace/ProxyTracer.js:51:20)
    at renderRoute ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/segments.ts:123:50)
    ...
    at async Object.eval [as fetch] ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/app.ts:367:24)
    at async https://jsr.io/@fresh/plugin-vite/1.1.2/src/plugins/dev_server.ts:122:26
```

Recorded K3 cross-check, same app with line 1 commented out - identical, no boot error:

```
event | sentinel
span | ['http.server GET']
span | ['http.server GET']
span | ['http.server GET']
```

Recorded workaround run (try/catch middleware after `app.use(staticFiles())`):

```
[{"type":"event","exception":"fresh route boom","mechanism":"generic","handled":true,"sdk":"sentry.javascript.deno","runtime":{"name":"deno","version":"2.9.0"},"hasContextLine":true}, ...]
```

Recorded build: `vite build` -> `_fresh/server/server-entry.mjs 1,490.70 kB`, exit=0.

Recorded dev-mode artifact: the very first request after `vite` starts gets no span, because Vite
SSR-loads `main.ts` (and therefore runs `Sentry.init`) during that request.

## Observed on 2026-09-07

**Matches the recorded verdict.** Every recorded behaviour reproduced: no boot error with or without
the import hook, no `event` for the route throw, method-only span names, the `NoopTracer` frames in
the stack, no client span for the outgoing `fetch`, and the try/catch middleware capturing the error
with source context. The sequence below was run twice, the second time from a clean `./install.sh`,
with identical results.

`items-prod.json` (`deno serve -A --port 41504 _fresh/server.js`, the six requests) - `GET /boom`
returned 500 and produced only an errored span, no `event`:

```
span | ['http.server GET /'] ok
span | ['http.server GET'] ok
span | ['http.server GET'] error      <- GET /boom, no event anywhere for it
span | ['http.server GET'] ok
span | ['http.server GET'] ok
event | sentinel | undefined: sentinel
span | ['http.server GET'] ok
```

The first and third entries verbatim, showing the naming (`GET /` keeps its path, `/api/alice`
collapses to bare `GET`):

```
{"type": "span", "trace_id": "...", "items": ["http.server GET /"],
 "raw": [{"name": "GET /", "status": "ok", "is_segment": true, "origin": "auto.http.deno"}]}
{"type": "span", "trace_id": "...", "items": ["http.server GET"],
 "raw": [{"name": "GET", "status": "error", "is_segment": true, "origin": "auto.http.deno"}]}
```

`prod.log` - the throw reaches Fresh's 500 renderer through `NoopTracer`, never Sentry (the frames
point into the bundled `server-entry.js` because this is the production build):

```
GET http://127.0.0.1:41504/boom
Error: fresh route boom
    at GET (file:///.../N9/_fresh/server/assets/_fresh-route___boom-CQvAE_M7.js:16:11)
    at file:///.../N9/_fresh/server/server-entry.js:5628:20
    at NoopContextManager.with (file:///.../N9/_fresh/server/server-entry.js:1021:16)
    at ContextAPI.with (file:///.../N9/_fresh/server/server-entry.js:1097:42)
    at NoopTracer.startActiveSpan (file:///.../N9/_fresh/server/server-entry.js:1432:29)
    at ProxyTracer.startActiveSpan (file:///.../N9/_fresh/server/server-entry.js:1508:20)
    at renderRoute (file:///.../N9/_fresh/server/server-entry.js:5611:28)
```

`dev.log` (`deno task dev --port 41503`, hook in place) reproduces the recorded stack in its
unbundled form, verbatim:

```
GET http://127.0.0.1:41503/boom
Error: fresh route boom
    at GET (/.../N9/routes/boom.tsx:8:11)
    at eval ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/segments.ts:140:20)
    at NoopContextManager.with (/.../N9/node_modules/.deno/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js:38:15)
    at ContextAPI.with (/.../N9/node_modules/.deno/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/src/api/context.js:79:42)
    at NoopTracer.startActiveSpan (/.../N9/node_modules/.deno/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js:79:27)
    at ProxyTracer.startActiveSpan (/.../N9/node_modules/.deno/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js:51:20)
    at renderRoute ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/segments.ts:123:50)
    ...
    at async Object.eval [as fetch] ( deno::0::https://jsr.io/@fresh/core/2.3.3/src/app.ts:367:24)
    at async https://jsr.io/@fresh/plugin-vite/1.1.2/src/plugins/dev_server.ts:122:26
```

`items-dev-nohook.json` (line 1 commented out, dev on 41503, four requests) - no boot error, and the
first request after vite starts still gets no span, exactly as recorded:

```
span | ['http.server GET'] error
span | ['http.server GET'] ok
event | sentinel | undefined: sentinel
span | ['http.server GET'] ok
```

`items-prod-workaround.json` (`N9_WORKAROUND=1`) - the route error is captured, with source context:

```
{"type": "event", "exception": "Error: fresh route boom", "mechanism": "generic", "handled": true,
 "sdk": "sentry.javascript.deno", "runtime": "deno", "hasContextLine": true,
 "trace_id": "3a87513472624a42ac80c5b8ebc5a717",
 "request": {"url": "http://127.0.0.1:41504/boom", "method": "GET", "hasData": false,
             "headers": {"accept": "*/*", "host": "127.0.0.1:41504", "user-agent": "curl/8.7.1"}},
 "environment": "production"}
span | ['http.server GET'] error
event | sentinel | undefined: sentinel
span | ['http.server GET'] ok
```

K2 confirmed on both sides: `items-prod.json` holds no `http.client` span for `/api/data`, and the
echo server saw no `sentry-trace` / `baggage` header (body of `GET /api/data`):

```
{"url": "/echo", "headers": {"accept": "*/*", "accept-language": "*", "user-agent": "Deno/2.9.0",
 "accept-encoding": "gzip,br", "host": "127.0.0.1:41338"}}
```

Build is clean, `build.log`:

```
_fresh/server/server-entry.js                              1,490.95 kB
```

Package identity: `node_modules/.deno` contains no `@sentry` entry and `deno.lock` has no
`@sentry/*` package, so resolution came from `sdk/node_modules` (the develop tarballs); the `span`
envelopes (stream lifecycle) also distinguish this from 10.73.0.

Differences from the record, none affecting the verdict:

- The SDK comes from the `_toolbox/pack` tarballs installed into `sdk/` and symlinked into
  `node_modules/@sentry/`, rather than symlinks into the `audit-runtime-docs` worktree. Same
  10.67.0 develop build.
- The app lives at the probe root instead of `develop/app/`, so the built entry is
  `_fresh/server/server-entry.js` (1,490.95 kB) rather than `server-entry.mjs` (1,490.70 kB).
- The try/catch workaround is behind `N9_WORKAROUND=1` in `main.ts` instead of being pasted in by
  hand, so one build covers both runs.
- `sink.mjs` is the current `_toolbox/qs/sink.mjs`, which keeps more per-item fields (`trace_id`,
  `raw`, `request`, `environment`) than the version the record was written against, and renders a
  `captureMessage` event's `exception` as `undefined: sentinel`.
- Envelope arrival order differs: the recorded items list put the sentinel event first, here it
  lands between spans. Both are arrival order only.

## Files

- `main.ts` - Fresh entry with the eight Sentry lines prepended and the `N9_WORKAROUND` middleware
- `routes/boom.tsx` - `throw new Error("fresh route boom")` in a route handler
- `routes/api/data.tsx` - `fetch` to the local echo server (K2 probe)
- `routes/sentinel.tsx` - `Sentry.captureMessage("sentinel")` + `flush`
- `routes/api/[name].tsx`, `routes/index.tsx`, `islands/`, `components/` - stock Fresh scaffold
- `deno.json` - stock scaffold plus `"@sentry/deno": "npm:@sentry/deno"` in `imports`
- `sdk/package.json` - the four develop tarballs; `install.sh` / `run.sh` - install and run drivers
- `sink.mjs`, `echo.mjs` - envelope sink and echo target
- `items-prod.json`, `items-prod-workaround.json`, `items-dev-nohook.json` - sink contents per run
- `prod.log`, `prod-workaround.log`, `dev.log`, `dev-nohook.log`, `build.log`, `install.log` - output
- `_fresh/` - built output, 1.6 MB, kept so `deno serve -A _fresh/server.js` runs without a rebuild
- `build2.log`, `build3.log`, `echo2.log`, `install2.log`, `pids.txt`, `sp.txt`,
  `sink-standalone.log`, `standalone.log`, `verify-*` - leftovers from an aborted earlier rebuild
  attempt, not part of this probe
