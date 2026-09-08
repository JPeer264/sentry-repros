# M-nestjs-cf: NestJS 11 (@nestjs/platform-express) on cloudflare (workerd via wrangler 4.56.0 dev, compatibility_date 2026-05-01)

## What it reproduces

Headline: NestJS + @nestjs/platform-express DOES run on workerd, and with the right build it is one of the better-instrumented Cloudflare framework cells (parameterized route names, middleware/handler/db/http.client spans) - but every bit of that depends on undocumented build wiring, and a plain `throw` in a controller still never reaches Sentry.

Findings worth filing:
1. `@sentry/server-utils/orchestrion/esbuild` is the missing documented path for non-Vite Cloudflare bundles. Enabling it flips route names from `GET /users/7` / source url to `GET /users/:id` / source route and adds the db span. @sentry/cloudflare's baseSdk.js:27-33 explicitly says only the Vite plugin injects the channels; the esbuild plugin exists and works, but no docs page mentions it.
2. With that plugin enabled, a Worker that calls `NestFactory.create` at module scope fails to BOOT: "Disallowed operation called within global scope ... generating random values are not allowed within global scope" originating in @nestjs/common/services/console-logger.service.js. The identical source without the plugin boots fine. So the orchestrion esbuild transform changes when the Nest module graph is evaluated (eager instead of lazy through esbuild's __require wrappers). Workaround: boot Nest lazily inside the fetch handler with dynamic imports. This is a real trap and would need to be in any docs page.
3. Errors are silently lost by default. Nest's ExceptionsHandler turns the throw into a 500 inside the node:http server, so @sentry/cloudflare's httpServerIntegration only sees a 500 response and records `status: internal_error` with no event. There is no `@sentry/nestjs`-style SentryGlobalFilter usable here (@sentry/nestjs pulls in @sentry/node), so the user must hand-write a `@Catch()` filter. A docs page must say this or users will think error monitoring is on when it is not.
4. workerd's `createRequire` cannot resolve `node:`-prefixed builtins ("No such module \"node:process\""), while `await import('node:process')` works (verified with app/probe/probe.mjs: {"hasGlobalProcess":"object","nodeProcess":"object","nodeNet":"function"}). Any esbuild-bundled CJS dependency that does `require('node:x')` - mysql2 does - needs a banner shim that strips the prefix. Even then `node:process` specifically must be aliased to a module returning globalThis.process.
5. mysql2 is unusable on workerd: `EvalError: Code generation from strings disallowed for this context`. Use `mysql@2`. Worth stating in the Cloudflare guide's database section.
6. Packaging trap that cost a build cycle: installing only sentry-cloudflare + sentry-core tarballs makes npm pull the RELEASED @sentry/server-utils@10.67.0 from the registry, which has no `./no-diagnostic-channels` export, and wrangler then fails with "Could not resolve \"@sentry/server-utils/no-diagnostic-channels\"" x6. The develop tarball must be installed alongside. This is a real hazard for anyone on a mixed install, not only for this harness.
7. Two TS diagnostics that do not block emit but look wrong: `cloudflare:node` has no type declarations shipped anywhere reachable, and `sendDefaultPii: true` fails with "Type 'true' is not assignable to type 'never'" against @sentry/cloudflare's option type - worth a look at the CloudflareOptions type.

All results above came from traceLifecycle: 'static'. I did not run a 'stream' pass; with stream the transaction envelopes become span envelopes and the same names should apply, but that is untested here.

Cleanup: wrangler dev, sink and recorder processes all killed; app/node_modules (336 MB) removed. Ports used: 42317 (wrangler), 42318 (throwaway probe worker), 41871 (sink), 43529 (recorder), 8080 inside the isolate.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

NestJS runs on workerd behind the node:http server bridge, and every Sentry capability except framework-swallowed errors works, but ONLY with a hand-built esbuild bundle plus the orchestrion esbuild plugin. Exact wiring a docs page would have to show:

1) Packages: `npm install @nestjs/core@11 @nestjs/common@11 @nestjs/platform-express@11 rxjs reflect-metadata express mysql esbuild typescript wrangler@4` plus the SDK tarballs `@sentry/cloudflare @sentry/core @sentry/server-utils @sentry/opentelemetry` (all four must be installed together, see notes).

2) wrangler.jsonc:
{ "name": "m-nestjs-cf", "compatibility_date": "2026-05-01",
  "compatibility_flags": ["nodejs_compat", "enable_nodejs_http_modules", "enable_nodejs_http_server_modules"],
  "main": "dist/worker.js" }

3) Entry (src/main.ts) - Nest must be booted LAZILY inside the fetch handler, not at module scope:
import 'reflect-metadata';
import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
const PORT = 8080;
let booted;
async function boot() {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');
  const { SentryFilter } = await import('./sentry.filter');
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new SentryFilter(app.getHttpAdapter()));
  await app.listen(PORT);
}
const nodeHandler = httpServerHandler({ port: PORT });
export default Sentry.withSentry(
  () => ({ dsn: '...', tracesSampleRate: 1.0, traceLifecycle: 'static' }),
  { async fetch(request, env, ctx) { booted ??= boot(); await booted; return nodeHandler.fetch(request, env, ctx); } },
);

4) Error capture needs an explicit Nest exception filter (Nest swallows handler throws):
@Catch() class SentryFilter extends BaseExceptionFilter {
  catch(exception, host) { Sentry.captureException(exception); super.catch(exception, host); }
}

5) Build: tsc (experimentalDecorators + emitDecoratorMetadata) -> esbuild bundle with
   format 'esm', platform 'node', external ['cloudflare:*','node:*','@sentry/cloudflare'],
   plugins: [processShimPlugin, sentryOrchestrionPlugin()]  // from '@sentry/server-utils/orchestrion/esbuild'
   banner: createRequire shim that STRIPS the 'node:' prefix,
   aliases stubbing class-validator, class-transformer, @nestjs/microservices*, @nestjs/websockets/socket-module.
   Do NOT set mainFields/conditions to prefer ESM (breaks express's require('is-promise')).

6) Run: `node build.mjs && npx wrangler dev --port <port> --inspector-port 0`.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH

# deps (node_modules was deleted afterwards to save disk; reinstall to rerun)
cd $S/deep/M-nestjs-cf/app
npm install --no-audit --no-fund @nestjs/core@11 @nestjs/common@11 @nestjs/platform-express@11 \
  rxjs reflect-metadata express mysql@2 esbuild wrangler@4 typescript
npm install --no-audit --no-fund $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz \
  $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz

# sink + recorder
cd $S/deep/M-nestjs-cf
PORT=41871 node $S/qs/sink.mjs > sink.log 2>&1 &
node recorder.mjs > recorder.log 2>&1 &

# build + run
cd $S/deep/M-nestjs-cf/app
./node_modules/.bin/tsc -p tsconfig.json      # 2 harmless TS errors (cloudflare:node types, sendDefaultPii), still emits
node build.mjs
npx wrangler dev --port 42317 --inspector-port 0 > ../wrangler-J.log 2>&1 &

# probes
curl -s -X DELETE http://127.0.0.1:41871/__items
curl -s http://127.0.0.1:42317/users/9
curl -s http://127.0.0.1:42317/error ; curl -s http://127.0.0.1:42317/error-filtered
curl -s http://127.0.0.1:42317/db ; curl -s http://127.0.0.1:42317/fetchout ; curl -s http://127.0.0.1:42317/logs
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
     -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=incoming,sentry-public_key=abc123,sentry-sampled=true' \
     http://127.0.0.1:42317/hello
(curl -s http://127.0.0.1:42317/iso/alpha & curl -s http://127.0.0.1:42317/iso/beta & curl -s http://127.0.0.1:42317/iso/gamma & wait)
curl -s http://127.0.0.1:42317/sentinel            # sentinel, then read
curl -s http://127.0.0.1:41871/__items | python3 -m json.tool
curl -s http://127.0.0.1:43529/__hits | python3 -m json.tool

# to reproduce the "no orchestrion" baseline: drop sentryOrchestrionPlugin() from the plugins array in build.mjs
```

Files: `app/`, `recorder.log`, `recorder.mjs`, `recorder.pid`, `sink.log`, `sink.pid`, `wrA.pid`, `wrB.pid`, `wrC.pid`, `wrD.pid`, `wrE.pid`, `wrF.pid`, `wrG.pid`, `wrH.pid`, `wrI.pid`, `wrJ.pid`, `wrP.pid`, `wrangler-A.log`, `wrangler-B.log`, `wrangler-C.log`, `wrangler-D.log`, `wrangler-E.log`, `wrangler-F.log`, `wrangler-G.log`, `wrangler-H.log`, `wrangler-I.log`, `wrangler-J.log`, `wrangler-probe.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | partial | A plain `throw new Error('nest-plain-error')` in a controller is swallowed by Nest's ExceptionsHandler: the sink got only `{"type": "transaction", "name": "GET /error", "status": "internal_error"}` and NO event. Adding a global `@Catch()` filter extending BaseExceptionFilter that calls Sentry.captureException produces the event with mechanism "generic", handled true, correct trace_id, and full request context (url/method/headers, user.ip_address). No automatic mechanism exists: @sentry/cloudflare's httpServerIntegration never sees the throw because Nest converts it to a 500 response inside the node:http server. traceLifecycle 'static'. |
| route names | works | With sentryOrchestrionPlugin() in the esbuild build the express instrumentation names the transaction `GET /users/:id` with source "route" (also `GET /iso/:tag`), and nests `middleware <anonymous>`, `middleware jsonParser`, `middleware urlencodedParser`, `handler /users/:id`. WITHOUT the plugin the same request is named `GET /users/7` with source "url" and zero child spans, i.e. raw URL, unparameterized. traceLifecycle 'static'. |
| isolation | works | Three concurrent GET /iso/{alpha,beta,gamma} (each Sentry.setTag('reqtag', ...), 150ms await, then captureException) produced three events each carrying only its own tag and its own trace_id, matching its own transaction's trace_id. No cross-talk. Verified on both the orchestrion and non-orchestrion builds. traceLifecycle 'static'. |
| incoming trace | works | A request with `sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1` plus baggage yielded a transaction with trace_id `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` and parent_span_id `bbbbbbbbbbbbbbbb`. Continuation is done by @sentry/cloudflare's withSentry at the Worker boundary, before the node:http bridge. traceLifecycle 'static'. |
| outgoing fetch | works | `fetch('http://127.0.0.1:43529/rec')` from inside a controller produced the child span `http.client GET http://127.0.0.1:43529/rec` and the recorder saw sentry-trace `40aa43231d2642d095ba75c054d446cc-a0f4e77b0f19a388-1` plus a full baggage header including sentry-transaction=GET%20%2Ffetchout. Works with and without the orchestrion plugin (it comes from @sentry/cloudflare's fetchIntegration). traceLifecycle 'static'. |
| db spans | partial | Instrumentation path: the esbuild plugin `sentryOrchestrionPlugin()` from `@sentry/server-utils/orchestrion/esbuild` (the esbuild analogue of the Cloudflare Vite plugin's buildTimeInstrumentation). It is REQUIRED: without it a module-scope mysql pool query returns rows but the transaction has `spans: []`; with it the transaction carries `db SELECT id, name FROM users`. Partial because the driver matters: `mysql2` cannot run on workerd at all (`EvalError: Code generation from strings disallowed for this context` from its generated row parsers), only `mysql@2` works. Module-scope pool, query issued inside the handler. traceLifecycle 'static'. |
| logs | works | `Sentry.logger.info('nest-cf-log-line', { where: 'handler' })` inside a controller arrived as a log envelope: `{"type": "log", "items": ["info: nest-cf-log-line"]}`. traceLifecycle 'static'. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
# Sink, final build (esbuild + sentryOrchestrionPlugin, lazy Nest boot, traceLifecycle: 'static')

{"type": "transaction", "name": "GET /users/:id", "op": "http.server", "source": "route", "status": "ok", "spans": ["middleware <anonymous>", "middleware jsonParser", "middleware urlencodedParser", "handler /users/:id"]}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "route", "status": "ok", "spans": ["middleware <anonymous>", "middleware jsonParser", "middleware urlencodedParser", "handler /db", "db SELECT id, name FROM users"]}
{"type": "transaction", "name": "GET /fetchout", "op": "http.server", "source": "route", "status": "ok", "spans": ["middleware <anonymous>", "middleware jsonParser", "middleware urlencodedParser", "handler /fetchout", "http.client GET http://127.0.0.1:43529/rec"]}
{"type": "transaction", "name": "GET /error", "op": "http.server", "source": "route", "status": "internal_error", "spans": ["middleware <anonymous>", "middleware jsonParser", "middleware urlencodedParser", "handler /error"]}      <-- NO event for the plain throw
{"type": "event", "exception": "Error: nest-filtered-error", "mechanism": "generic", "handled": true, "trace_id": "3ef8dbfe09724d26b9e4b3b4e85db714"}
{"type": "transaction", "name": "GET /error-filtered", "op": "http.server", "source": "route", "status": "internal_error", "trace_id": "3ef8dbfe09724d26b9e4b3b4e85db714", ...}
{"type": "transaction", "name": "GET /hello", "op": "http.server", "source": "route", "status": "ok", "trace_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "parent_span_id": "bbbbbbbbbbbbbbbb", ...}
{"type": "event", "exception": "Error: iso-alpha", "handled": true, "trace_id": "6e839e9b22ef42ae9d688777a1547fb9", "tags": {"reqtag": "alpha"}}
{"type": "event", "exception": "Error: iso-beta",  "handled": true, "trace_id": "f3a423b5a146434281eb085a85fe313f", "tags": {"reqtag": "beta"}}
{"type": "event", "exception": "Error: iso-gamma", "handled": true, "trace_id": "370198be67714895bedd5d8fe0d70718", "tags": {"reqtag": "gamma"}}
{"type": "transaction", "name": "GET /iso/:tag", "trace_id": "6e839e9b22ef42ae9d688777a1547fb9", ...}
{"type": "transaction", "name": "GET /iso/:tag", "trace_id": "f3a423b5a146434281eb085a85fe313f", ...}
{"type": "transaction", "name": "GET /iso/:tag", "trace_id": "370198be67714895bedd5d8fe0d70718", ...}
{"type": "log", "items": ["info: nest-cf-log-line"]}

# Recorder (outgoing fetch headers)
{"url": "/rec", "method": "GET",
 "sentryTrace": "40aa43231d2642d095ba75c054d446cc-a0f4e77b0f19a388-1",
 "baggage": "sentry-environment=production,sentry-public_key=abc123,sentry-trace_id=40aa43231d2642d095ba75c054d446cc,sentry-org_id=1,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.8986456590949647,sentry-sample_rate=1"}

# Same app WITHOUT sentryOrchestrionPlugin() -- raw URL names, no child spans, no db span
{"type": "transaction", "name": "GET /users/7", "op": "http.server", "source": "url", "status": "ok", "spans": []}
{"type": "transaction", "name": "GET /db", "op": "http.server", "source": "url", "status": "ok", "spans": []}
{"type": "transaction", "name": "GET /fetchout", "source": "url", "spans": ["http.client GET http://127.0.0.1:43529/rec"]}

# Blockers hit on the way (exact workerd/wrangler errors)
1. Uncaught Error: Dynamic require of "stream" is not supported            (esbuild ESM output, no require shim)
2. TypeError: isPromise2 is not a function                                 (mainFields ['module','main'] gave express the ESM build of is-promise)
3. Uncaught Error: No such module "node:process".  at node_modules/mysql2/lib/pool_cluster.js
   (workerd createRequire cannot resolve the "node:" prefix; `await import('node:process')` DOES work)
4. Could not resolve "@sentry/server-utils/no-diagnostic-channels"          (registry @sentry/server-utils@10.67.0 installed instead of the develop tarball)
5. EvalError: Code generation from strings disallowed for this context  at AppController2.db   (mysql2 row-parser codegen)
6. Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
     at worker.js:50875:52 ... in node_modules/@nestjs/common/services/console-logger.service.js
   -> appears ONLY when sentryOrchestrionPlugin() is enabled AND NestFactory.create runs at module scope. Deferring the boot into the fetch handler fixes it.
```

## Docs note

No page in ~/dev/sentry-docs mentions NestJS on Cloudflare. docs/platforms/javascript/guides/cloudflare/frameworks/ contains only astro, hono, hydrogen-react-router, hydrogen-remix, nextjs, nuxt, remix, sveltekit, tanstack-start - no nestjs.mdx - and the framework list in docs/platforms/javascript/guides/cloudflare/index.mdx:16-23 does not include Nest. The NestJS guide is Node-only: docs/platforms/javascript/guides/nestjs/index.mdx:5 sets `fallbackGuide: javascript.node` and :6-8 `categories: javascript, server, server-node`, with no runtime caveat anywhere. Nothing in docs/ or platform-includes/ mentions `httpServerHandler`, `enable_nodejs_http_server_modules`, or `orchestrion` - so the esbuild plugin that is the only way to get route names and db spans here is entirely undocumented.
