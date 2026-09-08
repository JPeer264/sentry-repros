# verify4-M-nestjs-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-nestjs-bun` (see `$REPRO/cells/M-nestjs-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-bundled-static.log`, `app-bundled-stream.log`, `app-nodehook.log`, `app-runtimeplugin.log`, `app-unbundled.log`, `app.pid`, `build-b.ts`, `build.ts`, `drive.mjs`, `package-lock.json`, `package.json`, `preload-nodehook.ts`, `preload-runtime.ts`, `run-b-app-bundled-external-stream.log`, `run-b-app-bundled.log`, `run-b-app-runtimeplugin.log`, `run-b-app-unbundled.log`, `run-b-b.pid`, `run-b-bundled.pid`, `run-b-rp.pid`, `run-b-sink.log`, `run-b-unbundled.pid`, `sink.log`, `sink.pid`, `src/`, `tsconfig.json`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Refutation failed; the report stands, and the cause is a deliberate SDK limitation, not a NestJS-specific defect.

Probe dir: $SCRATCH/deep/verify4-M-nestjs-bun-dbspans (NestJS 11 + @nestjs/platform-express, @sentry/nestjs + @sentry/bun 10.67.0 tarballs, bun 1.4.0, mysql@2 connection at module scope in src/db.ts, MariaDB 127.0.0.1:3307). Sink: `PORT=47311 node $S/qs/sink.mjs`. Driver: `APP_PORT=<port> SINK_PORT=47311 node drive.mjs` (hits /users/7, /db, /db, /sentinel and waits for the sentinel event).

1) BUNDLED WORKS (`bun run build.ts && PORT=47320 LIFECYCLE=static bun dist/main.js`, log run-b-app-bundled.log):
 {"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":["middleware <anonymous>","middleware jsonParser","middleware urlencodedParser","handler /db","db SELECT id, name FROM users"]}

2) UNBUNDLED STILL EMPTY (`PORT=47321 LIFECYCLE=static SENTRY_DEBUG=1 bun src/main.ts`, log run-b-app-unbundled.log). Not only no db span, the route name degrades too:
 {"type":"transaction","name":"GET /users/7","op":"http.server","source":"url","status":"ok","spans":[]}
 {"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","spans":[]}
 {"type":"transaction","name":"GET /sentinel","op":"http.server","source":"url","status":"ok","spans":[]}
 app log line 100: Sentry Logger [warn]: [Sentry] No diagnostics-channel injection detected. Channel-based integrations will not record spans. Make sure the diagnostics channels are injected via the runtime `--import` hook or a bundler plugin before the instrumented modules load.

3) REFUTATION ATTEMPT A, runtime Bun plugin (preload-runtime.ts = `Bun.plugin(sentryBunPlugin())` then `import './src/instrument'`, run as `bun --preload ./preload-runtime.ts src/main.ts`) CRASHES the app at import (log run-b-app-runtimeplugin.log line 1):
 SyntaxError: Export named 'Injectable' not found in module '.../node_modules/@nestjs/common/index.js'.

4) REFUTATION ATTEMPT B, Node-style injection hook (preload-nodehook.ts = `import '@sentry/server-runtime-injection/register'`) is a no-op on Bun (log app-nodehook.log line 1 and line 100), spans still `[]`:
 Sentry Logger [warn]: No available Node API to register diagnostics-channel injection hooks; skipping.
 `bun -e "console.log(typeof require('node:module').registerHooks)"` -> undefined on bun 1.4.0.

5) BOTH LIFECYCLES WORK WHEN BUNDLED. Stream (`LIFECYCLE=stream bun dist-b/main.js`, run-b-app-bundled-external-stream.log) gives the db span correctly parented under the express handler span:
 {"type":"span","items":["middleware urlencodedParser","middleware jsonParser","middleware <anonymous>","db SELECT users","handler /db","http.server GET /db"],"raw":[...{"name":"SELECT users","status":"ok","parent_span_id":"a0a806d865c5cbf7","is_segment":false,"origin":"auto.db.mysql"},{"name":"/db","status":"ok","parent_span_id":"8a2392d58c657ddd","origin":"auto.http.express"},{"name":"GET /db","status":"ok","is_segment":true,"origin":"auto.http.server"}]}

Why it cannot be refuted: the SDK states it. ~/dev/sentry-worktrees/audit-runtime-docs/packages/bun/src/plugin.ts:16 says "This is BUILD-ONLY. Runtime instrumentation (`bun run`) is currently not supported." and packages/server-utils/src/orchestrion/bundler/bun.ts:22-26 gives the exact reason my attempt A hit: "a module returned by a runtime `onLoad` plugin in Bun loses its CommonJS named exports. When https://github.com/oven-sh/bun/pull/31770 lands, we can revisit." The same file also notes "Bun has no runtime fallback here, so bundling is the only injection path."

Reference app: the repo has no NestJS-on-Bun e2e app. The Bun+db reference is dev-packages/e2e-tests/test-applications/bun-mysql, whose build.ts uses the identical `Bun.build` + `sentryBunPlugin()` pattern and whose start script is `bun run dist/app.js` — i.e. the bundler is the documented, only path, and this is not NestJS-specific (it applies to express/koa/fastify/AI spans on Bun equally).

One improvement over the reported wiring: `@sentry/bun` and `mysql` may stay in `external` (the plugin strips instrumented packages back out of `external`), so only the app and the instrumented libraries pass through the bundler and the SDK/OTel stack is not bundled. Verified in build-b.ts / dist-b — db spans still recorded (evidence 5 above). The NestJS-specific `external` entries (@nestjs/microservices[/microservices-module], @nestjs/websockets[/socket-module], @nestjs/platform-express/multer, class-validator, class-transformer, cache-manager) remain mandatory; without them the build fails with `error: Could not resolve: "@nestjs/microservices/microservices-module"`.

Processes started were killed (apps on 47320/47321/47322/47323, sink pid 60234). Note: a concurrent agent's Nuxt app (verify4-M-nuxt-bun-isolation, pid 67335) was also tunnelling into port 47311, so two stray items from ports 47312/47313 appear in my first sink dump; they are not mine and I left that process alone.

## Workaround

There is no unbundled workaround; the bundle is the only path. Minimal working recipe (verified, build-b.ts):

import { sentryBunPlugin } from '@sentry/bun/plugin';
await Bun.build({
  entrypoints: ['./src/main.ts'], outdir: './dist', target: 'bun', sourcemap: 'external',
  external: ['@sentry/bun', 'mysql',
             '@nestjs/microservices', '@nestjs/microservices/microservices-module',
             '@nestjs/websockets', '@nestjs/websockets/socket-module',
             '@nestjs/platform-express/multer', 'class-validator', 'class-transformer', 'cache-manager'],
  plugins: [sentryBunPlugin()],
});

then `bun run build.ts && bun dist/main.js`. `@sentry/bun` and the instrumented drivers may be listed in `external` (the plugin un-externalizes instrumented packages itself); the six @nestjs optional-peer entries plus class-validator/class-transformer/cache-manager must be listed or the build fails to resolve them. src/main.ts must start with `import './instrument';` then `import 'reflect-metadata';`, instrument.ts must init `@sentry/bun`, app.module.ts needs `SentryModule.forRoot()` plus `{ provide: APP_FILTER, useClass: SentryGlobalFilter }`, and tsconfig.json needs experimentalDecorators + emitDecoratorMetadata. Do NOT try `Bun.plugin(sentryBunPlugin())` at runtime: it breaks @nestjs/common's CommonJS named exports and the app will not boot.

## Docs impact

On Bun, Sentry instruments libraries only at build time, so a NestJS app must be bundled with `Bun.build` + `sentryBunPlugin()` from `@sentry/bun/plugin` and started as `bun dist/main.js` to get database, Express/middleware and route-name (`source: "route"`) spans — running `bun src/main.ts` directly yields transactions with an empty `spans` array and URL-based names — and the build's `external` list must include Nest's lazily required optional peers (`@nestjs/microservices`, `@nestjs/microservices/microservices-module`, `@nestjs/websockets`, `@nestjs/websockets/socket-module`, `@nestjs/platform-express/multer`, `class-validator`, `class-transformer`, `cache-manager`) or it fails with `Could not resolve: "@nestjs/microservices/microservices-module"`.
