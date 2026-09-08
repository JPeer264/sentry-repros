# verify4-M-nestjs-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-nestjs-cf` (see `$REPRO/cells/M-nestjs-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `sink.log`, `sink.pid`, `sink2.log`, `sinkA.log`, `sinkA.pid`, `wrA.pid`, `wrB.pid`, `wrC.pid`, `wrR1.pid`, `wrR2.pid`, `wrR3.pid`, `wrangler-A.log`, `wrangler-B.log`, `wrangler-C.log`, `wrangler-R1.log`, `wrangler-R2.log`, `wrangler-R3.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The claim "no automatic mechanism exists, you must hand-build a `@Catch()` filter that calls `Sentry.captureException`, and you get mechanism `generic` / handled `true`" is wrong. The SDK already ships the filter: `SentryGlobalFilter` from `@sentry/nestjs/setup`. Registered the documented way (`APP_FILTER` provider + `SentryModule.forRoot()`), it works unchanged on workerd with `@sentry/cloudflare` as the client and produces the proper auto mechanism.

EXACT CHANGE (src/app.module.ts), no other change to the prior probe's app:

  import { APP_FILTER } from '@nestjs/core';
  import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

  @Module({
    imports: [SentryModule.forRoot()],
    controllers: [AppController],
    providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
  })
  export class AppModule {}

plus `@sentry/nestjs` in package.json. `src/sentry.filter.ts` (the hand-built filter) is no longer imported by anything. `src/main.ts` is unchanged from the prior probe apart from dropping `app.useGlobalFilters(...)`.

RUN 1 - orchestrion build (`dist/worker.js`), `traceLifecycle: 'static'`, port 41782/41778, sink 41777:

{"type":"event","exception":"Error: nest-plain-error","mechanism":"auto.http.nestjs.global_filter","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","transaction":"GET /error","trace_id":"73b6be6a6d844eff8409bec847255162","user":{"ip_address":"127.0.0.1"},"request":{"url":"http://127.0.0.1:41778/error","method":"GET","headers":{...,"cf-connecting-ip":"127.0.0.1","user-agent":"curl/8.7.1"}},"environment":"production"}
{"type":"transaction","name":"GET /error","op":"http.server","source":"route","status":"internal_error","trace_id":"73b6be6a6d844eff8409bec847255162","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /error"]}
{"type":"event","exception":"Error: nest-async-error","mechanism":"auto.http.nestjs.global_filter","handled":false,...,"transaction":"GET /error-async","trace_id":"4e5d35a6a04b4bcb881fea9f6cb4b02a"}
{"type":"transaction","name":"GET /error-expected","op":"http.server","source":"route","status":"not_found","trace_id":"82ad698878484b5f9a0fe5f8a273cd5a",...}   <-- NotFoundException correctly NOT captured (isExpectedError)

So: mechanism `auto.http.nestjs.global_filter`, `handled: false` (not `generic`/`true`), trace_id matches the transaction, full request context and `user.ip_address`, async throws covered, and expected `HttpException`s correctly filtered out - i.e. full parity with Node NestJS.

RUN 2 - SAME BUILD MINUS the orchestrion plugin (`build-noorch.mjs` -> `dist-noorch/worker.js`), port 41780. Error capture is fully intact without `sentryOrchestrionPlugin()`:

{"type":"event","exception":"Error: nest-plain-error","mechanism":"auto.http.nestjs.global_filter","handled":false,"transaction":"GET /error","trace_id":"49b5f286a3df4991bff9cf081da43674","request":{"url":"http://127.0.0.1:41780/error","method":"GET",...}}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"49b5f286a3df4991bff9cf081da43674","spans":[]}
{"type":"event","exception":"Error: nest-async-error","mechanism":"auto.http.nestjs.global_filter","handled":false,...}

Only the express middleware/handler spans and `source: "route"` are lost. The orchestrion plugin is needed for library SPANS, not for error capture - a large simplification of the recipe for the errors capability.

RUN 3 - orchestrion build with the DEFAULT `traceLifecycle: 'stream'`, port 41782. Same result:

{"type":"event","exception":"Error: nest-plain-error","mechanism":"auto.http.nestjs.global_filter","handled":false,"transaction":"GET /error","trace_id":"a389d7e18f8942cd8b996993132c8478",...}
{"type":"span","trace_id":"a389d7e18f8942cd8b996993132c8478","items":["middleware urlencodedParser","middleware jsonParser","middleware <anonymous>","handler /error","http.server GET /error"]}

WHY IT WORKS: `@sentry/nestjs/setup` (worktree `packages/nestjs/src/setup.ts`) imports only `@nestjs/common`, `@nestjs/core`, `rxjs` and `captureException` from `@sentry/core` - never `@sentry/node`. Verified: `grep -c "sentry.javascript.node" dist/worker.js` -> 0 and on `dist-noorch/worker.js` -> 0. It therefore captures through whatever client is active, here `sentry.javascript.cloudflare`. This is exactly the wiring the repo's own e2e app uses (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/nestjs-11/src/app.module.ts) and exactly what the Nest docs prescribe (~/dev/sentry-docs/platform-includes/getting-started-capture-errors/javascript.nestjs.mdx:40-54).

SIDE OBSERVATION (not this capability): in `stream` lifecycle the `/error-expected` 404 segment span carries `"status":"error"`, while in `static` lifecycle the same request produces `"status":"not_found"`.

FILES / COMMANDS (rerunnable):
  D=$REPRO/refutations/verify4-M-nestjs-cf-errors
  $D/app/src/app.module.ts     (the change: SentryGlobalFilter + SentryModule)
  $D/app/src/main.ts           ($REPRO/_toolbox/pack tarballs, lazy Nest boot, httpServerHandler bridge)
  $D/app/src/app.controller.ts ( /error, /error-async, /error-expected, /sentinel )
  $D/app/build.mjs             (esbuild + process shim + orchestrion)
  $D/app/build-noorch.mjs      (same minus orchestrion -> dist-noorch/)
  $D/app/wrangler.jsonc, $D/app/wrangler-noorch.jsonc
  $D/sinkA.log, $D/wrangler-R1.log (static+orchestrion), $D/wrangler-R2.log (noorch), $D/wrangler-R3.log (stream)

  cd $D/app && npm install --no-audit --no-fund
  npx tsc -p tsconfig.json ; node build.mjs        # or node build-noorch.mjs
  PORT=41777 node $REPRO/_toolbox/sink.mjs &
  npx wrangler dev --config wrangler.jsonc --port 41778 --inspector-port 0
  curl http://127.0.0.1:41778/error ; curl http://127.0.0.1:41778/sentinel
  curl -s http://127.0.0.1:41777/__items

All processes started were killed. `node_modules` (417M) left in place so the probe reruns without a reinstall.

## Workaround

None needed. Use the SDK's own filter instead of a hand-written one: install `@sentry/nestjs` alongside `@sentry/cloudflare` and add to the root module `imports: [SentryModule.forRoot()]` and `providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }]`, both from `@sentry/nestjs/setup`. Nothing in `src/main.ts` changes. For error capture alone the `sentryOrchestrionPlugin()` esbuild plugin can also be dropped; keep it only if you want express middleware/handler spans and `source: "route"` transaction names.

## Docs impact

On Cloudflare Workers, NestJS error capture uses the same wiring as on Node: install `@sentry/nestjs` next to `@sentry/cloudflare` and register `SentryGlobalFilter` from `@sentry/nestjs/setup` as an `APP_FILTER` provider (with `SentryModule.forRoot()` in `imports`) in your root module - `@sentry/nestjs/setup` depends only on `@nestjs/*` and `@sentry/core`, so it reports through the Cloudflare client and yields events with mechanism `auto.http.nestjs.global_filter`, `handled: false`, correct trace linking and request context, while expected `HttpException`s are not reported. No hand-written `@Catch()` filter is required, and the `sentryOrchestrionPlugin()` esbuild plugin is only needed for library spans, not for error capture.
