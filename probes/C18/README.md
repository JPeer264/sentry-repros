# C18 - Astro on Cloudflare Workers

Runtime: Cloudflare Workers (`wrangler dev` 4.129.0 / workerd 1.20260903.1) | Astro 7.3.1 +
`@astrojs/cloudflare` 14.3.0 | SDK: `@sentry/astro` + `@sentry/cloudflare` 10.67.0 (develop line,
tarballs in `_toolbox/pack/`; the record was written against 10.73.0)

## What it reproduces

A minimal Astro app with `output: server` via `@astrojs/cloudflare`, set up the way the Cloudflare
Astro guide describes: `astro.config.mjs` has `cloudflare()` plus `sentry()`, and `wrangler.jsonc`
points `main` at a hand-written `./sentry.server.config.ts` that does
`Sentry.withSentry((env) => ({ dsn, tunnel, tracesSampleRate: 1 }), handler)` with `handler` imported
from `@astrojs/cloudflare/entrypoints/server`. `astro build` writes `dist/server/wrangler.json`, and
`wrangler dev --config dist/server/wrangler.json` serves the built Worker. The probe asks whether the
Cloudflare SDK actually instruments the Astro app from that custom entry: `/api/hello` should give a
route-named server transaction, `/api/error` an unhandled error event plus a failed transaction, and
`/api/sentinel` a `captureMessage`, all from the Cloudflare SDK rather than the Astro/browser one.

## Install

From this directory:

```
npm install --no-audit --no-fund \
  ../../_toolbox/pack/sentry-astro-10.67.0.tgz ../../_toolbox/pack/sentry-cloudflare-10.67.0.tgz \
  ../../_toolbox/pack/sentry-core-10.67.0.tgz ../../_toolbox/pack/sentry-browser-10.67.0.tgz \
  ../../_toolbox/pack/sentry-browser-utils-10.67.0.tgz ../../_toolbox/pack/sentry-feedback-10.67.0.tgz \
  ../../_toolbox/pack/sentry-replay-10.67.0.tgz ../../_toolbox/pack/sentry-replay-canvas-10.67.0.tgz \
  ../../_toolbox/pack/sentry-node-10.67.0.tgz ../../_toolbox/pack/sentry-opentelemetry-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-utils-10.67.0.tgz \
  ../../_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  ../../_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz \
  astro@7.3.1 @astrojs/cloudflare@14.3.0 wrangler@4
```

## Run

The sink URL (`http://127.0.0.1:47318/`) and the DSN live in `wrangler.jsonc` under `vars`; change the
port there and in the commands below together if it is taken. `dist/` from the run below is checked in,
so the `astro build` step can be skipped unless a source file changed. From this directory:

```
PORT=47318 node ../../_toolbox/sink.mjs > sink.log 2>&1 & spid=$!
npx astro build > build.log 2>&1
npx wrangler dev --config dist/server/wrangler.json --port 47418 --inspector-port 0 > wrangler.log 2>&1 & apid=$!
for i in $(seq 1 90); do grep -q "Ready on http://localhost:47418" wrangler.log && break; sleep 1; done
node drive.mjs 47418 47318 > result.json 2>&1
kill $apid; kill $spid; wait $apid; wait $spid
cat result.json
```

`drive.mjs` clears the sink, calls `/`, `/api/hello`, `/api/error`, then `/api/sentinel`, polls the
sink until the sentinel event is there and prints the whole sink. `../../_toolbox/sink.mjs` is the
unmodified shared envelope sink.

## Expected

Recorded verdict: **works** (recorded against 10.73.0).

Astro 7.3.1 + `@astrojs/cloudflare` 14.3.0 + `@sentry/astro` + `@sentry/cloudflare` set up as the docs
describe: `astro build` writes `dist/server/wrangler.json`; `wrangler dev --config
dist/server/wrangler.json` serves it. `/api/hello` gives a route-named transaction, `/api/error` an
unhandled event (mechanism `auto.middleware.astro`, sdk `sentry.javascript.cloudflare`) plus a
transaction with status `internal_error`. One client init per request.

Recorded evidence lines (runA):

```
{"type":"transaction","name":"GET /api/hello","source":"route","status":"ok"}
{"type":"event","exception":"C18 api error route","mechanism":"auto.middleware.astro","handled":false,"sdk":"sentry.javascript.cloudflare"}
{"type":"transaction","name":"GET /api/error","status":"internal_error"}
```

The record also carries two variants that are **not** rebuilt here (they are separate setups, not this
app): runB1, the `astro-5-cf-workers` style with a `Sentry.init` from `@sentry/astro` in
`sentry.server.config.ts` and no custom `main`, which on adapter 14 is inert (`@sentry/astro`'s
Cloudflare Vite plugin regex targets `astrojs-ssr-virtual-entry` and never matches; the sink saw only
`GET /` and a sentinel with sdk `sentry.javascript.astro`, `wrangler.log` showed
`Integration installed: BrowserApiErrors`, `Global Handler attached: onerror` and
`Using the browserSessionIntegration in non-browser environments is not supported`, and
`grep -rl withSentry dist/server` had no match); and runB3, wrangler `SENTRY_*` vars alone, whose sink
stayed empty.

## Observed on 2026-09-07

**Matches** the recorded verdict (**works**), on the develop line (10.67.0) instead of the recorded
10.73.0. Run from a clean `node_modules` (the Install command above), then the Run commands above, in
this directory. Verbatim trimmed output (`result.json` in this directory, sink fields the record did
not print elided with `...`):

```
GET / -> 200 <!DOCTYPE html><html lang="en"><head><title>C18</title>...
GET /api/hello -> 200 {"hello":"c18"}
GET /api/error -> 500

{"type": "transaction", "name": "GET /api/hello", "op": "http.server", "source": "route", "status": "ok", "sdk": "sentry.javascript.cloudflare", "spans": [], ...}
{"type": "event", "exception": "Error: C18 api error route", "mechanism": "auto.middleware.astro", "handled": false, "sdk": "sentry.javascript.cloudflare", "runtime": "cloudflare", "transaction": "GET /api/error", "request": {"url": "http://127.0.0.1:47418/api/error", "method": "GET", ...}, ...}
{"type": "transaction", "name": "GET /api/error", "op": "http.server", "source": "route", "status": "internal_error", "sdk": "sentry.javascript.cloudflare", "spans": [], ...}
{"type": "event", "message": "sentinel", "exception": "undefined: sentinel", "mechanism": "generic", "handled": true, "sdk": "sentry.javascript.cloudflare", "runtime": "cloudflare", "transaction": "GET /api/sentinel", ...}
{"type": "transaction", "name": "GET /api/sentinel", "op": "http.server", "source": "route", "status": "ok", "sdk": "sentry.javascript.cloudflare", "spans": [], ...}

[wrangler.log] GET / 200 OK / GET /api/hello 200 OK / [ERROR] Error: C18 api error route / GET /api/error 500 Internal Server Error / GET /api/sentinel 200 OK
[build.log] astro build exit 0, "[build] Complete!", dist/server/wrangler.json written with "main":"entry.mjs"
grep -rl withSentry dist/server -> dist/server/entry.mjs
```

All three recorded evidence lines are present with the recorded values: the route-named `ok`
transaction for `/api/hello`, the unhandled `C18 api error route` event with mechanism
`auto.middleware.astro` and sdk `sentry.javascript.cloudflare`, and the `internal_error` transaction
for `/api/error`. None of the runB1 symptoms appear: `wrangler.log` has no `BrowserApiErrors` /
`onerror` / `browserSessionIntegration` lines, and `withSentry` is present in `dist/server/entry.mjs`.

Differences from the record, none of which change the verdict:

- SDK version: 10.67.0 (develop tarballs) instead of the recorded 10.73.0, per the develop-only rule.
- `sentry.server.config.ts` passes `traceLifecycle: 'static'` so the envelopes are `transaction` items
  with the recorded shape; the develop default is `traceLifecycle: 'stream'`, which would emit `span`
  envelopes instead and is the only reason this option is there.
- The app is hand-written (5 source files) rather than generated by
  `npm create astro@latest -- --template minimal`, and it lives at the root of this directory instead
  of an `app/` subdirectory. Astro and adapter versions are pinned to the recorded 7.3.1 / 14.3.0.
- `GET /` produces no envelope at all: the index page is prerendered and served from the `ASSETS`
  binding, so the Sentry-wrapped `fetch` handler never runs for it. The record's runA evidence has no
  `/` item either.
- A `/api/sentinel` route was added to make the sink read deterministic; it calls
  `Sentry.captureMessage('sentinel')` from `@sentry/cloudflare` and arrives with sdk
  `sentry.javascript.cloudflare`, confirming from inside the app code that the Cloudflare client, not
  the Astro/browser one, is the active client in the Worker.
- "One client init per request" from the record was not re-measured; SDK debug logging is off here.

## Files

- `astro.config.mjs` - `cloudflare()` adapter plus `sentry()` integration, both with no options
- `sentry.server.config.ts` - the wrangler entry: `Sentry.withSentry((env) => ({...}), handler)` with
  `handler` from `@astrojs/cloudflare/entrypoints/server`
- `wrangler.jsonc` - `main: ./sentry.server.config.ts`, `compatibility_date: 2026-05-01`,
  `nodejs_compat`, `SENTRY_DSN` and `SINK_URL` vars
- `src/pages/index.astro` - prerendered index page
- `src/pages/api/hello.ts` - `GET` returning JSON, `prerender = false`
- `src/pages/api/error.ts` - `GET` throwing `Error('C18 api error route')`
- `src/pages/api/sentinel.ts` - `GET` calling `Sentry.captureMessage('sentinel')` from `@sentry/cloudflare`
- `drive.mjs` - request driver plus sentinel poll, prints the sink
- `dist/` - the `astro build` output of the run above (kept so the run needs no rebuild; 1.3 MB)
- `result.json`, `sink.log`, `wrangler.log`, `build.log`, `install.log`, `install2.log` - output of
  the run above
