# verify4-M-nestjs-bun-routenames

## What it re-tests

Independent re-test of the capability **route names (NestJS 11 + @nestjs/platform-express on Bun 1.4.0 with @sentry/nestjs + @sentry/bun, develop 10.67.0 tarballs)** of cell `M-nestjs-bun` (see `$REPRO/cells/M-nestjs-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-bundled-hybrid.log`, `app-bundled-nestinit.log`, `app-bundled-static.log`, `app-bundled-stream.log`, `app-runtime-plugin.log`, `app-unbundled-debug.log`, `app-unbundled-rename.log`, `app-unbundled-static.log`, `app.pid`, `build-hybrid.ts`, `build-nest.ts`, `build-noext.ts`, `build.ts`, `npm-install.log`, `npm-install2.log`, `package-lock.json`, `package.json`, `preload-runtime-plugin.ts`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `sink3.log`, `sink3.pid`, `sink4.log`, `sink4.pid`, `src/`, `tsconfig.json`, `v1-unbundled-static.log`, `v1.pid`, `v10-unbundled-stream.log`, `v10.pid`, `v11-rename2-stream.log`, `v11.pid`, `v2-bundled-static.log`, `v2.pid`, `v3-unbundled-nestinit.log`, `v3.pid`, `v4-unbundled-hybrid.log`, `v4.pid`, `v5-preload.log`, `v5.pid`, `v6-runtime-plugin.log`, `v7-rename-static.log`, `v7.pid`, `v8-rename2-static.log`, `v8.pid`, `v9-bundled-stream.log`, `v9.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Could not refute; the reported split reproduces exactly, and the unbundled case is in fact slightly worse than reported. Probe dir: $SCRATCH/deep/verify4-M-nestjs-bun-routenames (node_modules removed after the run; reinstall with the npm install line from the report, then `bun run build.ts`). Sink on 38911, app ports 38912-38922, all processes killed.

Variants tried (all with `import './instrument'` first line, SentryModule.forRoot() + APP_FILTER SentryGlobalFilter, tsconfig with experimentalDecorators/emitDecoratorMetadata):

V1 `bun src/main.ts`, LIFECYCLE=static (baseline, src/main.ts + src/instrument.ts, log v1-unbundled-static.log):
 {"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.bun","spans":[]}

V2 `bun run build.ts && bun dist/main.js`, static (build.ts with sentryBunPlugin + the @nestjs/microservices/websockets/multer/class-validator/class-transformer/cache-manager externals):
 {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /users/:id"]}

V9 same bundle, LIFECYCLE=stream:
 {"type":"span","items":["middleware urlencodedParser","middleware jsonParser","middleware <anonymous>","handler /users/:id","http.server GET /users/:id"],"raw":[...{"name":"GET /users/:id","is_segment":true,"origin":"auto.http.server"}]}

V10 unbundled + stream (the DEFAULT lifecycle) — worse than the original report, which only measured static. The segment span carries no path at all, so every route collapses into one name:
 {"type":"span","items":["http.server GET"]}

V3 init from `@sentry/nestjs` instead of `@sentry/bun`, unbundled (src/instrument-nest.ts + src/main-nest.ts): NO server span of any kind, and events lose their transaction name:
 {"type":"event","message":"sentinel","sdk":"sentry.javascript.nestjs","runtime":"node","trace_id":"42a7973198d5472f82838f826da7be5e"}   <- no "transaction" field, no transaction/span envelope at all
 app log (debug:true): `Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.`

V4 `@sentry/bun` + explicit `nestIntegration()` unbundled: unchanged, `GET /users/42` source `url`.
V5 `bun --preload ./src/instrument.ts src/main-noinit.ts` (different init placement): unchanged, `GET /users/42` source `url`.
V6 runtime plugin registration in a preload (`plugin(sentryBunPlugin())` from `bun`, preload-runtime-plugin.ts): app does not boot —
 [probe] runtime plugin registered
 SyntaxError: Export named 'Injectable' not found in module '.../node_modules/@nestjs/common/index.js'
 This is the exact limitation the SDK documents in packages/server-utils/src/orchestrion/bundler/bun.ts ("BUILD-ONLY ... a module returned by a runtime onLoad plugin in Bun loses its CommonJS named exports", oven-sh/bun#31770). Bun 1.4.0 also has `node:module.registerHooks === undefined`, and packages/server-runtime-injection/src/register.ts explicitly excludes Bun from the `Module.register` fallback, so there is no runtime injection path on Bun by construction.

Root cause of the partial: on Bun the route name comes only from the express instrumentation's `http.route`, which is injected at bundle time by sentryBunPlugin; without a bundle nothing patches Nest's express router, and the SDK prints no warning at all unless `debug: true` (v1-unbundled-static.log contains zero Sentry output).

## Workaround

Unbundled Bun can be given real route names from user code with a global Nest interceptor (src/route-name2.interceptor.ts + src/main-rename2.ts): read `req.route.path`, then on the root span call `updateName(`${req.method} ${route}`)`, `setAttribute('http.route', route)` and — this is the load-bearing part on develop — `setAttribute('sentry.segment.name.source', 'route')`. Static: {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route"}; stream: {"type":"span","items":["http.server GET /users/:id"]}. Setting the old `sentry.source` attribute instead does NOT work: `updateName()` calls INTERNAL_setSegmentNameSourceIfSegment(span,'custom') (packages/core/src/tracing/sentrySpan.ts:232) and the earlier interceptor variant that set `sentry.source` produced {"name":"GET /users/:id","source":"custom"}. The interceptor only fixes the name/source; the express `middleware`/`handler` child spans stay absent. The supported fix remains bundling with sentryBunPlugin.

## Docs impact

A Bun + NestJS docs page must say: on Bun, NestJS route names (and the express middleware/handler child spans) only exist when you bundle your app with `Bun.build({ target: 'bun', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run the bundle — with plain `bun src/main.ts` the server span is `GET /users/42` with source `url` under `traceLifecycle: 'static'` and just `http.server GET` (no path at all) under the default `'stream'` lifecycle, with no warning unless `debug: true`; the build additionally needs `external: ['@nestjs/microservices', '@nestjs/microservices/microservices-module', '@nestjs/websockets', '@nestjs/websockets/socket-module', '@nestjs/platform-express/multer', 'class-validator', 'class-transformer', 'cache-manager']` or it fails with `error: Could not resolve: "@nestjs/microservices/microservices-module"`, and `Sentry.init` must come from `@sentry/bun` (initializing from `@sentry/nestjs`/`@sentry/node` on Bun yields no server spans at all). Note that the current Bun guide states the opposite of the develop behavior — ~/dev/sentry-docs/docs/platforms/javascript/guides/bun/index.mdx:98: "Sentry's auto-instrumentation does not work with bundled code ... If you need to bundle your application, you'll need to manually instrument your code" — and that sentence has to be replaced, not amended.
