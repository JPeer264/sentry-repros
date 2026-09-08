# verify4-M-nuxt-bun-incomingtrace

## What it re-tests

Independent re-test of the capability **incoming trace** of cell `M-nuxt-bun` (see `$REPRO/cells/M-nuxt-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-b.log`, `app-c.log`, `app-c2.log`, `app-d.log`, `app-nodeserver-bun.log`, `app.pid`, `build-b.log`, `build-c.log`, `build-d.log`, `build-node-server.log`, `dc-probe.mjs`, `dump.py`, `run-A.log`, `run-D.log`, `run-E.log`, `run-variant.sh`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The original report is correct about the documented wiring, and I found the exact one-line change that makes the capability work while keeping `@sentry/nuxt`.

Stack: Nuxt 4.5.2 / Nitro 2.13.4, `NITRO_PRESET=bun`, run as `PORT=41417 bun run .output/server/index.mjs` (bun 1.4.0), `@sentry/nuxt` 10.67.0 from develop, `autoInjectServerSentry: 'top-level-import'`, stream lifecycle. Probe request always:
  curl -H 'sentry-trace: 12345678901234567890123456789012-1234567890123456-1' -H 'baggage: sentry-trace_id=...,sentry-sampled=true' http://127.0.0.1:41417/users/42 (and /api/error)

VARIANT A - documented wiring, `Sentry.init` from `@sentry/nuxt` (confirms the report):
  event  trace=04550485aa0a4475854eeb4f49385996 parent=None name=GET /api/error msg=nuxt-bun-route-error
  event  trace=04550485aa0a4475854eeb4f49385996 parent=None name=GET /api/error msg=sentinel
No `span` envelope at all; incoming trace id ignored; the later sentinel (a different request) reuses the same trace id and even the same `transaction` name, i.e. isolation is gone too.

VARIANT D - same `@sentry/nuxt` init plus `integrations: [bunServerIntegration()]` from `@sentry/bun` (THE FIX):
  event  trace=12345678901234567890123456789012 parent=1234567890123456 name=GET /api/error msg=nuxt-bun-route-error
  span   trace=12345678901234567890123456789012 parent=1234567890123456 seg=True name=GET /users/:id op=http.server
  span   trace=12345678901234567890123456789012 parent=1234567890123456 seg=True name=GET op=http.server
  event  trace=77e88d5450834c69bae4818d7d3c9b1a parent=None name=None msg=sentinel
Incoming trace continued (trace id AND parent span id), an `http.server` segment span is emitted, the parameterized route name `GET /users/:id` survives (the Nuxt route detector sets source=route, so streaming keeps the route in the name), isolation is restored (sentinel gets its own trace), and the SDK identity stays `sentry.javascript.nuxt` - unlike the previously reported workaround of initializing `@sentry/bun`, which reports `sentry.javascript.bun` and drops the Nuxt event processors. Boot log shows `Integration installed: BunServer` next to the normal Node integrations; no conflict with the (inert) `Http` integration.

VARIANT E - control, `Sentry.init` from `@sentry/bun`: byte-identical trace behavior to D.

ROOT CAUSE (verified, not theory): on develop `@sentry/node`'s request isolation, trace continuation and server span all hang off one diagnostics channel - `packages/core/src/integrations/http/constants.ts:3` `HTTP_ON_SERVER_REQUEST = 'http.server.request.start'`, subscribed in `packages/node/src/integrations/http/httpServerIntegration.ts:146`. Bun 1.4.0 never publishes that channel. Direct probe (`dc-probe.mjs`, subscribe + `node:http` server + one fetch):
  bun  -> channel fired: 0
  node -> channel fired: 1
So this is preset-independent: the `bun` preset serves via `Bun.serve` (no `node:http` at all), and even the `node-server` preset run under bun gets no event, which is why the boot log also prints `No available Node API to register diagnostics-channel injection hooks; skipping`. `@sentry/bun` continues the trace because `bunServerIntegration` patches `Bun.serve` and calls `continueTrace` itself (`packages/bun/src/integrations/bunserver.ts:243`). `bunServerIntegration` only depends on `@sentry/core` APIs, which is why dropping it into a Nuxt/Node client works.

FILES / RERUN: $SCRATCH/deep/verify4-M-nuxt-bun-incomingtrace/
  app/nuxt.config.ts, app/sentry.server.config.ts (holds the variant-D source form), app/server/routes/users/[id].ts, app/server/api/{error,sentinel,ping}.ts
  run-variant.sh (A|D|E: rewrites line 1 of .output/server/index.mjs to import sentry.variant<V>.mjs, boots bun, sends the traced requests + sentinel, dumps traces), dump.py, sink.mjs (port 41318), dc-probe.mjs, run-A.log / run-D.log / run-E.log
The three `.output/server/sentry.variant{A,D,E}.mjs` files are edits of the Nitro-generated config, so all three variants were exercised on one build; the D form was also produced by a real `NITRO_PRESET=bun npx nuxt build` from `app/sentry.server.config.ts` (build-d.log). `app/node_modules` is absent (disk); restore with the npm install line from the task description (all tarballs on one command line, `@sentry/bundler-plugins` packed from the worktree) before rebuilding. All processes killed; ports 41318/41417 free.

## Workaround

Keep the documented `@sentry/nuxt` wiring and add the Bun server integration to it. `sentry.server.config.ts`:

  import { bunServerIntegration } from '@sentry/bun'
  import * as Sentry from '@sentry/nuxt'

  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    integrations: [bunServerIntegration()],
  })

Requires `@sentry/bun` as a dependency (Nitro bundles it into `.output/server/node_modules`) and `sentry: { autoInjectServerSentry: 'top-level-import' }` in `nuxt.config.ts`, because bun ignores NODE_OPTIONS and has no `--import` flag. Build with `NITRO_PRESET=bun npx nuxt build`, run with `bun run .output/server/index.mjs`. This restores incoming trace continuation, `http.server` spans, parameterized route names and request isolation, while events keep `sdk: sentry.javascript.nuxt`. Switching the whole init to `@sentry/bun` also works but loses the Nuxt SDK identity and event processors.

## Docs impact

The Nuxt guide (~/dev/sentry-docs/docs/platforms/javascript/guides/nuxt/, no file mentions bun; index.mdx:61-68 documents only `node --import ./.output/server/sentry.server.config.mjs`) needs a Bun section saying: "Running a Nuxt server on Bun: set `sentry.autoInjectServerSentry: 'top-level-import'` (Bun ignores NODE_OPTIONS and has no `--import` flag), build with `NITRO_PRESET=bun`, and add `integrations: [bunServerIntegration()]` from `@sentry/bun` to your `Sentry.init` in `sentry.server.config.ts` - without it Bun's server receives no `http.server.request.start` diagnostics-channel event, so incoming `sentry-trace`/`baggage` headers are ignored, no server spans are recorded and requests share one isolation scope."
