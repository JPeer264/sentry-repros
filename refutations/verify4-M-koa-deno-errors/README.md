# verify4-M-koa-deno-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-koa-deno` (see `$REPRO/cells/M-koa-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app.pid`, `app.ts`, `build-cjs.mjs`, `build-nobanner.mjs`, `build-noplugin.mjs`, `build-v4-noplugin.mjs`, `build-v4.mjs`, `build.mjs`, `deno.json`, `instrument.ts`, `main-hook.ts`, `main-nohook.ts`, `main.ts`, `package-lock.json`, `package.json`, `run-base.log`, `run-cjs.log`, `run-esbuild-stream.log`, `run-esbuild.log`, `run-hook-283.log`, `run-hook-290.log`, `run-nobanner.log`, `run-noplugin.log`, `sink-v4.log`, `sink-v4.pid`, `sink.log`, `sink.pid`, `v4-run-esbuild-stream.log`, `v4-run-esbuild.log`, `v4-run-hook.log`, `v4-run-nohook.log`, `v4-run-noplugin.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Koa route errors DO reach Sentry automatically on Deno, with no hand-written `app.on('error')` and without `@sentry/deno/import` — the app just has to be bundled with esbuild plus `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild`. Build-time channel injection replaces the runtime import hook that crashes on Deno, so `attachKoaErrorHandler` fires off the `orchestrion:koa:callback` channel exactly as on Node.

Probe dir: $SCRATCH/deep/verify4-M-koa-deno-errors/ (app.ts, instrument.ts, main.ts, main-hook.ts, build.mjs, build-nobanner.mjs, build-cjs.mjs, build-noplugin.mjs, deno.json, run-*.log). koa 3.2.1, @koa/router 15.7.0, deno 2.9.0, @sentry/deno 10.67.0 from $REPRO/_toolbox/pack tarballs. `ERR_HANDLER` was never set in any bundled run, i.e. the app registers NO error listener of its own.

Install / build / run:
  npm install $REPRO/_toolbox/pack/sentry-deno-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz koa@3 @koa/router@15 esbuild
  node build.mjs      # esbuild: entry main.ts, bundle, platform node, format esm, external ['@sentry/deno','@sentry/server-utils'], plugins [sentryOrchestrionPlugin()], banner createRequire
  TUNNEL=http://127.0.0.1:58211/ PORT=58213 LIFECYCLE=static deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys dist/main.js

1) BASELINE (unbundled `deno run main.ts`, no hook, no manual handler) reproduces the reported gap — GET /boom yields only a transaction, no event (sentinel proves the pipeline was flushed):
   {"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"c7070d1cb0144180ba44fe259d2dac27","sdk":"sentry.javascript.deno","spans":[]}
   {"type":"event","message":"sentinel","mechanism":"generic","handled":true,"transaction":"GET /sentinel", ...}

2) ESBUILD + sentryOrchestrionPlugin(), traceLifecycle "static" — the auto handler fires:
   {"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"11f95e9b128f41ffac0efa81c73fe774","sdk":"sentry.javascript.deno","spans":["router /boom"]}
   {"type":"event","exception":"Error: koa boom","mechanism":"auto.middleware.koa","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","hasContextLine":true,"transaction":"GET /boom","trace_id":"11f95e9b128f41ffac0efa81c73fe774","request":{"url":"http://127.0.0.1:58213/boom","method":"GET"}}
   Same run also fixes two neighbouring findings for free: `source":"route"` with `"GET /users/:id"` instead of `"GET /users/42"`, and koa `router` middleware spans.

3) Same recipe with traceLifecycle "stream" — identical result:
   {"type":"event","exception":"Error: koa boom","mechanism":"auto.middleware.koa","handled":false,"transaction":"GET /boom","trace_id":"4fe1d014cc7045759eb707a90255c5a6", ...}
   {"type":"span","trace_id":"4fe1d014cc7045759eb707a90255c5a6","items":["router /boom","http.server GET /boom"]}

4) CONTROL — same bundle, plugin made inert (`sentryOrchestrionPlugin({ buildTimeInstrumentation: false })`): back to no event, `source":"url"`, no koa spans. So the plugin, not the bundling, is what does it:
   {"type":"transaction","name":"GET /boom","source":"url","status":"internal_error","spans":[]}
   {"type":"event","message":"sentinel","mechanism":"generic","transaction":"GET /sentinel"}

5) The import hook is still dead on Deno 2.9.0 (`deno run main-hook.ts`, run-hook-290.log), so the previous agent's diagnosis of WHY the auto handler never fires unbundled is correct — only their conclusion that no configuration exists is wrong:
   error: Uncaught (in promise) SyntaxError: Unexpected token ':'
   var codes = require('./codes.json')
       at Object.<anonymous> (.../node_modules/statuses/index.js:15:13)
   Deno 2.8.3 (the CI pin) could not be retested: $SCRATCH/deno283 no longer exists on this machine.

Two build shapes that do NOT work and must be avoided in a docs snippet:
- `format: 'cjs'` (so the createRequire banner is unnecessary): `Error: [ERR_PACKAGE_PATH_NOT_EXPORTED] No "exports" main defined in .../@sentry/deno/package.json` — the Deno SDK is ESM-only.
- ESM output without the banner, or with `@sentry/server-utils` bundled instead of external: `Error: Dynamic require of "node:async_hooks" is not supported` (esbuild's `__require` shim in ESM output; the injected snippet itself does `__require("@sentry/server-utils")`).

Confirmed still true and unchanged: `@sentry/deno` exports no `setupKoaErrorHandler` (only `koaIntegration` / deprecated `denoKoaIntegration`), while `@sentry/node`, `@sentry/bun`, `@sentry/elysia`, `@sentry/astro`, and the serverless SDKs all do. That is a real, separate export gap — it just is not what blocks error capture, since the bundled path needs no manual call at all.

## Workaround

Bundle the Koa app with esbuild and the Sentry orchestrion plugin, then run the bundle with Deno; no import hook, no manual `app.on('error')`.

build.mjs:
  import * as esbuild from 'esbuild';
  import { sentryOrchestrionPlugin } from '@sentry/server-utils/orchestrion/esbuild';
  await esbuild.build({
    entryPoints: ['./main.ts'],          // main.ts = import './instrument.ts'; import './app.ts';
    bundle: true, platform: 'node', format: 'esm', target: 'node22',
    outfile: 'dist/main.js',
    external: ['@sentry/deno', '@sentry/server-utils'],
    banner: { js: "import { createRequire as __cr } from 'node:module';\nconst require = __cr(import.meta.url);" },
    plugins: [sentryOrchestrionPlugin()],
  });

  node build.mjs
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys dist/main.js

Both `external` entries and the banner are load-bearing (see details for the two failure modes). Without a bundler, the only unbundled fallback stays the hand-written `app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'manual.koa.onerror', handled: false } }))`, which produces a correctly scoped event but the wrong mechanism and no koa spans or route names.

## Docs impact

On Deno, Koa needs build-time instrumentation instead of the `import "@sentry/deno/import"` runtime hook (which crashes Koa at import on Deno 2.9): bundle your server with esbuild using `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` — with `format: 'esm'`, `external: ['@sentry/deno', '@sentry/server-utils']` and a `createRequire` banner — and run the bundle with `deno run`; that gives you automatic Koa error capture (`auto.middleware.koa`), router spans, and parameterized route names with no `app.on('error')` of your own, and note that `@sentry/deno` does not export `setupKoaErrorHandler`.
