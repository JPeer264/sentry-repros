# verify4-M-nuxt-deno-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-nuxt-deno` (see `$REPRO/cells/M-nuxt-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `.output-deno/`, `.output-deno2/`, `RERUN.sh`, `RERUN2.sh`, `app/`, `app-denopreset.log`, `app-node-server-deno.log`, `app-node-server-node.log`, `app-stream-deno.log`, `app-v2-deno-stream.log`, `app-v2-deno.log`, `app-v2-denopreset.log`, `app-v2-denopreset.pid`, `app-v2-node.log`, `app-v2-node.pid`, `app-v2-stream.pid`, `app-v2.pid`, `app.pid`, `app2.pid`, `app3.pid`, `build-deno-preset.log`, `build-node-server.log`, `build-v2-denopreset.log`, `build-v2-nodeserver.log`, `install1.log`, `install2.log`, `nodeapp.pid`, `nuxt.config.ts`, `package-lock.json`, `package.json`, `sentry.server.config.ts`, `server/`, `sink-v2.log`, `sink-v2.pid`, `sink.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The failure is caused by one line in the previous probe's `nuxt.config.ts` (`nitro: { preset: 'deno_server' }`), not by Deno. Drop that line and the *default* `node-server` Nitro output, run under `deno run`, produces full server transactions with parameterized route names, at parity with the same output run under Node.

WORKS (deno 2.9.0, nuxt 4.5.2 / nitro 2.13.4, @sentry/nuxt 10.67.0 develop, `autoInjectServerSentry: 'top-level-import'`):
nuxt.config.ts -> `nitro: { preset: 'node-server' }` (i.e. just omit the preset), `npx nuxt build`,
`cd .output/server && PORT=34415 deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./index.mjs`
The module also prepends `import './sentry.server.config.mjs';` to `.output/server/index.mjs` correctly here, so no manual patching is needed.

Sink, `traceLifecycle: 'static'` (verbatim, trimmed):
{"type":"transaction","name":"GET /api/users/:id","op":"http.server","source":"route","trace_id":"35e5078...","sdk":"sentry.javascript.nuxt","spans":[]}
{"type":"transaction","name":"GET /api/trace","op":"http.server","source":"url","status":"ok"}
{"type":"transaction","name":"GET /api/sentinel","op":"http.server","source":"url","status":"ok"}
`curl /api/trace` -> {"name":null,"op":null,"hasActive":true}   # getActiveSpan() IS defined inside the handler

Sink, default `traceLifecycle: 'stream'` (same build, `SENTRY_LIFECYCLE=stream`):
{"type":"span","trace_id":"f8e0455d...","items":["http.server GET /api/users/:id"],"raw":[{"name":"GET /api/users/:id","is_segment":true,"origin":"auto.http.http_server"}]}

Control, identical `.output` run under `node ./index.mjs` (port 34418): transaction 'GET /api/users/:id' source route, 'GET /api/trace' url, 'GET /api/users/boom' url -> byte-for-byte the same shape as Deno. Deno adds no gap.

BROKEN CONTRAST, reproduced: rebuilt the same app with `NITRO_PRESET=deno_server` into `.output-deno2`. `curl /api/trace` -> {"name":null,"op":null,"hasActive":false}; zero `transaction` and zero `span` envelopes for 4 requests; only `event` items, both carrying `"transaction":"GET /api/users/boom"`. So the previous probe's observation is right for that preset (Nitro serves through `Deno.serve`, which @sentry/node does not instrument), but it is a preset choice, not a Deno limitation.

Two real defects seen along the way, both narrower than the reported one:
1. `addSentryTopImport` writes the import into a file literally named `.output-deno2/server/deno.json start` (46 bytes: the import line plus the string "undefined"). Cause is `getFilenameFromNodeStartCommand` parsing Nitro's deno preset preview command `deno task --config .output-deno2/deno.json start` (packages/nuxt/src/vite/addServerConfig.ts:92-104); it takes the token after `--config` and the trailing `start` word. Only affects the `deno_server`/`deno_deploy` presets.
2. Route-name enrichment does not run on error responses, on Deno AND on Node alike: `/api/users/boom` yields `"name":"GET /api/users/boom","source":"url"`. Nitro v2 goes through `update-route-name-legacy.server.ts` (`beforeResponse` hook), which is not invoked for a thrown handler. Not runtime-specific, so it belongs to a separate finding.

## Workaround

Do not set `nitro: { preset: 'deno_server' }`. Build the default `node-server` output (`npx nuxt build`) and run it with Deno: `cd .output/server && deno run --allow-net --allow-read --allow-write --allow-env --allow-sys --allow-ffi --unstable-byonm ./index.mjs`. Nitro's node-server entry uses `node:http`, which Deno's Node compat layer serves and which @sentry/node instruments, so `http.server` spans, `getActiveSpan()` inside handlers, and the `updateRouteBeforeResponse` hook (parameterized `GET /api/users/:id`, `source: "route"`, `url.path.parameter.*`) all work. Both `traceLifecycle: 'static'` and the default `'stream'` produce the parameterized name. If the `deno_server` preset is required for other reasons, there is no workaround for route names, and the sentry import must additionally be prepended to `.output/server/index.mjs` by hand.

## Docs impact

On the Nuxt guide (~/dev/sentry-docs/docs/platforms/javascript/guides/nuxt/, which currently has no Deno mention at all): "To run a Nuxt server on Deno with tracing, keep Nitro's default `node-server` preset and run the build output with `deno run --allow-net --allow-read --allow-env --allow-sys .output/server/index.mjs` together with `autoInjectServerSentry: 'top-level-import'`; the `deno_server` and `deno_deploy` presets serve through `Deno.serve`, which the SDK does not instrument, so those presets record errors but no request transactions and no parameterized route names."
