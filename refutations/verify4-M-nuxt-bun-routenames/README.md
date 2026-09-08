# verify4-M-nuxt-bun-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-nuxt-bun` (see `$REPRO/cells/M-nuxt-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RESULTS.txt`, `app/`, `apppid.txt`, `build-A.log`, `build-B.log`, `build-C.log`, `build-D.log`, `build-F.log`, `build-G.log`, `dc-probe.mjs`, `npm-install.log`, `run-A-nuxtsdk-bunpreset.log`, `run-A2.log`, `run-B.log`, `run-C.log`, `run-D.log`, `run-F.log`, `run-G.log`, `sink-run2.log`, `sink.log`, `sink.mjs`, `sinkpid.txt`, `variants/`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED, with a smaller change than the one reported. Route names work fully on Nuxt 4.5.2 + nitro `bun` preset under bun 1.4.0 while KEEPING the documented `import * as Sentry from '@sentry/nuxt'` init. The only edit needed in `sentry.server.config.ts` is one added integration:

    import * as Sentry from '@sentry/nuxt'
    import { bunServerIntegration } from '@sentry/bun'   // npm install @sentry/bun
    Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, integrations: [bunServerIntegration()] })

Stream lifecycle (default), sink lines verbatim:
{"type":"span","trace_id":"6872c507fc79479595a50bd862e1ab83","items":[{"name":"GET /users/:id","op":"http.server","is_segment":true,"origin":"auto.http.bun.serve","seg_name":"GET /users/:id","seg_source":"route","http_route":"/users/:id","params":{"url.path":"/users/55","http.route":"/users/:id","url.path.parameter.id":"55","params.id":"55"}}]}
{"type":"span","trace_id":"bfdbf7787f504a2c97b5c16d767c9057","items":[{"name":"GET","op":"http.server","is_segment":true,"origin":"auto.http.bun.serve","seg_name":"GET","seg_source":"url","params":{"url.path":"/api/ping"}}]}
{"type":"event","message":"sentinel","...,"sdk":"sentry.javascript.nuxt","trace_id":"5a93f1c9210845458961357babdb387d"}   <- isolation also fixed: sentinel no longer inherits the earlier request's trace

Same config with traceLifecycle: 'static':
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.nuxt","data":{...,"http.route":"/users/:id","url.path.parameter.id":"55","params.id":"55"}}
{"type":"transaction","name":"GET /api/ping","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.nuxt",...}
So static lifecycle names unparameterized routes by URL path, stream lifecycle by method only, which is the documented default and not a defect.

The SDK name stays `sentry.javascript.nuxt` (the reported `@sentry/bun` workaround changes it to `sentry.javascript.bun`), and the Nuxt module's h3/`updateRouteBeforeResponse` hook supplies `http.route` in both cases.

Baselines I re-established first (all in the same app, same sink):
A. Documented wiring (`@sentry/nuxt` only), `NITRO_PRESET=bun` + `bun run .output/server/index.mjs`: zero spans, and the sentinel leaks the previous request's trace:
   {"type":"event","exception":"Error: nuxt-bun-route-error","sdk":"sentry.javascript.nuxt","transaction":"GET /api/error","trace_id":"30c1ef82848f4225a2d90111ff9bbc8a"}
   {"type":"event","message":"sentinel","sdk":"sentry.javascript.nuxt","transaction":"GET /api/error","trace_id":"30c1ef82848f4225a2d90111ff9bbc8a"}
B. NEW, corrects the prior report: the default `node-server` preset DOES run under bun (`bun run .output/server/index.mjs` boots and serves), so "the bun preset entry ends in Bun.serve" is not the blocker. But it still yields zero spans, identical to A.
C. Control: the exact same `node-server` build under `node` gives the correct name, so nothing about Nuxt/top-level-import is at fault:
   {"type":"span","items":[{"name":"GET /users/:id","op":"http.server","origin":"auto.http.http_server","seg_name":"GET /users/:id","seg_source":"route","http_route":"/users/:id","params":{"url.path":"/users/55","http.route":"/users/:id","url.path.parameter.id":"55","params.id":"55"}}]}
E. Reported workaround (`import * as Sentry from '@sentry/bun'`) reproduces exactly, with `sdk":"sentry.javascript.bun"`.

ROOT CAUSE (isolated, not theorised). `@sentry/node`'s `httpServerIntegration` creates the server span from Node's native diagnostics channel `http.server.request.start` (packages/core/src/integrations/http/constants.ts:3, subscribed at packages/node/src/integrations/http/httpServerIntegration.ts:146). Bun's `node:http` never publishes that channel. Minimal proof, /private/tmp/.../deep/verify4-M-nuxt-bun-routenames/dc-probe.mjs (subscribe to the channel, hit a `node:http` server):
   -- node: http.server.request.start fired: true
   -- bun:  http.server.request.start fired: false
That is why no preset choice helps: on bun neither `Bun.serve` nor `node:http` produces a server span from @sentry/node's default set. `@sentry/bun` covers both with `bunServerIntegration` (Bun.serve) and `bunHttpServerIntegration` (node:http), and @sentry/nuxt ships neither. Boot log on bun also shows "[Sentry] Runtime hook not registered" and "Bundler plugin ran, injected libraries=[]" (node prints "Runtime hook registered").

REPRO. Probe dir $SCRATCH/deep/verify4-M-nuxt-bun-routenames/ (app/, sink.mjs, dc-probe.mjs, variants/A-documented-nuxt.ts, variants/D-nuxt-plus-bunServerIntegration.ts, variants/E-bun-sdk.ts). app/node_modules removed after the run; restore with, from app/:
  npm install nuxt@^4.5.2 $REPRO/_toolbox/pack/sentry-nuxt-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-browser-10.67.0.tgz $REPRO/_toolbox/pack/sentry-vue-10.67.0.tgz $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bundler-plugins-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz
  (the develop-built sentry-bundler-plugins tarball was already in $REPRO/_toolbox/pack this time; without it `nuxt build` dies with `(0 , _core.nodeStackLineParser) is not a function`, as reported)
  PORT=47231 node ../sink.mjs &
  cp variants/D-nuxt-plus-bunServerIntegration.ts -> app/sentry.server.config.ts
  NITRO_PRESET=bun npx nuxt build && PORT=41343 bun run .output/server/index.mjs
  curl http://127.0.0.1:41343/users/55 ; curl http://127.0.0.1:41343/api/sentinel ; curl http://127.0.0.1:47231/__items
nuxt.config.ts uses `sentry: { autoInjectServerSentry: 'top-level-import', debug: true }` (bun ignores NODE_OPTIONS and has no `--import`, so the documented `node --import ./.output/server/sentry.server.config.mjs` path does not exist).

Reference e2e app read (read-only): ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/nuxt-4 and nuxt-3-top-level-import — both start with plain `node`, neither covers bun.

## Workaround

In `sentry.server.config.ts`, keep `Sentry.init` from `@sentry/nuxt` and add `bunServerIntegration()` from `@sentry/bun` to `integrations` (install `@sentry/bun` alongside `@sentry/nuxt`). This restores `http.server` segment spans on the nitro `bun` preset with `name`/`sentry.segment.name` = `GET /users/:id`, `sentry.segment.name.source=route`, `http.route=/users/:id`, `url.path.parameter.id`/`params.id`, and it also restores per-request isolation, while the SDK keeps reporting as `sentry.javascript.nuxt`. Alternative, coarser: replace the whole init with `import * as Sentry from '@sentry/bun'` (same spans, but the SDK identifies as `sentry.javascript.bun`). If the app is served through `node:http` (nitro `node-server` preset run under bun), use `bunHttpServerIntegration()` instead of `bunServerIntegration()`.

## Docs impact

On the Nuxt "Nitro Deployment Presets" page (~/dev/sentry-docs/docs/platforms/javascript/guides/nuxt/features/nitro-deployment-presets.mdx, which today says presets "work out of the box" and carves out only Cloudflare), add a Bun section: "When you deploy with the `bun` Nitro preset and run the build with `bun`, the Node-based server instrumentation in `@sentry/nuxt` cannot create incoming-request spans, because Bun does not emit Node's `http.server.request.start` diagnostics channel and does not run Bun.serve through `node:http`. Install `@sentry/bun` and add `bunServerIntegration()` to `integrations` in your `sentry.server.config.ts` (keeping `Sentry.init` from `@sentry/nuxt`); server transactions, parameterized route names such as `GET /users/:id`, and per-request isolation then work as on Node. Also note that Bun ignores `NODE_OPTIONS` and has no `--import` flag, so on Bun you must use `sentry: { autoInjectServerSentry: 'top-level-import' }` instead of the documented `node --import ./.output/server/sentry.server.config.mjs` start command."
