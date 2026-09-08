# M-elysia-cf: Elysia 1.4.30 on Cloudflare Workers (wrangler 4.129.0 dev, workerd 1.20260903.1, compatibility_date 2026-05-01, nodejs_compat)

## What it reproduces

Corrections to the task's setup hint: (a) `@sentry/elysia`'s `withElysia` DOES load and work on workerd. Its own source only imports `@sentry/core` and `@sentry/conventions`; the `@sentry/bun` re-export sits in the package index and esbuild tree-shakes it away when you import just `withElysia`. Only `init` from `@sentry/elysia` is unusable there (sdk.js imports `node:os`, `global.process.env`, and `@sentry/bun`'s init). (b) Plain `withSentry` around `app.fetch` is the strictly worse option: no route names and, worse, zero error events, because Elysia's default error handling turns the throw into a 500 response before it can reach the Worker's fetch handler.

Ordering trap worth a docs callout: `withElysia` installs its route-naming hook with `.onAfterHandle({ as: 'global' })`. On workerd with `aot: false`, that hook does not reach routes that were already registered, so `withElysia(appWithRoutes)` names only the error path. `withElysia(new Elysia({aot:false})).get(...)` names everything. On Bun this ordering probably does not matter (the Bun branch of `app.wrap` owns the root span); it does here.

No Elysia lifecycle spans on Cloudflare. `platform-includes/.../javascript.elysia.mdx:3-5` promises spans for Request/Parse/Transform/BeforeHandle/Handle/AfterHandle/MapResponse/AfterResponse/Error with `op: request_handler.elysia` / `middleware.elysia`; on workerd every transaction came back with `spans: []` except the `http.client` fetch span. The `app.trace()` handler that creates them depends on `rootSpanForRequest`, which is only populated by the Bun branch of `app.wrap`.

Tarball hazard for whoever reruns this: `$REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz` and `$REPRO/_toolbox/pack/sentry-core-10.67.0.tgz` are older than `$REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz`. Using them together fails the wrangler build with `The path "./no-diagnostic-channels" is not exported by package "@sentry/server-utils"` and then `No matching export in "@sentry/core/build/esm/index.js" for import "spanSourceWasExplicitlySet" / "markSpanForOtelSourceInference" / "_INTERNAL_startInactiveSpan"`. Repacking core, opentelemetry, cloudflare and server-utils from $W fixed it. Also, `npm install $REPRO/_toolbox/pack/sentry-elysia-...tgz` needs `sentry-server-runtime-injection-10.67.0.tgz` on the same command line or it fails with `notarget No matching version found for @sentry/server-runtime-injection@10.67.0`.

mysql2 on workerd: works from a module-scope pool over the nodejs_compat TCP polyfill, but only with `disableEval: true`; the default row-parser codegen dies with `Code generation from strings disallowed for this context`. Queries returned real rows from the MariaDB on 3307. Still no db span, and the Cloudflare Vite plugin (`buildTimeInstrumentation`) path was not exercised, so treat the db verdict as "no span from a plain wrangler build" rather than "no span on Cloudflare, ever".

Environment friction: ports 41318 and 41319 were already held by another agent's recorder, and my first sink on 41317 was killed by something outside this task mid-run, which cost one repeat of the probe batch. Final ports used were 52741/52742/52744/52745. All processes I started were killed and both `node_modules` trees were removed; the source, configs and logs remain.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Elysia runs on workerd ONLY with AOT disabled: `new Elysia({ aot: false })`. With the default (aot on) workerd refuses to start the Worker: "Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O ..., setting a timeout, and generating random values are not allowed within global scope ... at worker.js:15:16 in eval / at index.js:20163:4 in composeGeneralHandler" (Elysia's codegen'd handler runs `new Function` at module scope and touches randomness).

Recommended wiring (this is what a docs page should show; it is NOT the plain-withSentry-only shape the task hint assumed):

packages: `npm install @sentry/cloudflare @sentry/elysia elysia wrangler` (for the develop build: `npm install <worktree packs>/sentry-{core,opentelemetry,cloudflare,server-utils}-10.67.0.tgz $REPRO/_toolbox/pack/sentry-{elysia,bun,node,server-runtime-injection}-10.67.0.tgz elysia wrangler@4`)

src/index.ts:
```ts
import { withElysia } from '@sentry/elysia';
import * as Sentry from '@sentry/cloudflare';
import { Elysia } from 'elysia';

// withElysia MUST wrap the instance BEFORE any route is registered
const app = withElysia(new Elysia({ aot: false }))
  .get('/users/:id', ({ params }) => ({ id: params.id }))
  .get('/p/:id/boom', () => { throw new Error('boom'); });

export default Sentry.withSentry(
  (env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 1.0, sendDefaultPii: true }),
  { fetch: (request) => app.fetch(request) },
);
```
Init placement: `withSentry` supplies the client, the isolation scope, the root `http.server` span and the incoming-trace continuation. Do NOT call `init` from `@sentry/elysia` (its `sdk.js` imports `node:os` and `@sentry/bun`); only the `withElysia` wrapper is used. Importing `withElysia` from `@sentry/elysia` bundles fine under wrangler/esbuild even though the package's index re-exports `@sentry/bun` — esbuild tree-shakes the Bun/Node side away, so the hint that "@sentry/elysia will most likely not load on workerd" is wrong for the wrapper.

wrangler.jsonc: `{"main":"src/index.ts","compatibility_date":"2026-05-01","compatibility_flags":["nodejs_compat"]}`
run: `npx wrangler dev --port <port> --inspector-port 0`

Fallback (no @sentry/elysia): `withSentry` around `app.fetch` alone also boots and gives spans/logs/isolation/trace propagation, but transaction names stay URL-sourced and handler errors are silently swallowed unless you add your own `.onError(({ error }) => Sentry.captureException(error))`.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
W=~/dev/sentry-worktrees/audit-runtime-docs
D=$REPRO/cells/M-elysia-cf

# 1. the $REPRO/_toolbox/pack tarballs for core/server-utils are stale vs @sentry/cloudflare, repack from the worktree
for p in core opentelemetry cloudflare server-utils; do (cd $W/packages/$p && npm pack --pack-destination $D/localpack); done

# 2. plain-withSentry app (node_modules was removed after the run, reinstall to rerun)
cd $D
npm install ./localpack/sentry-core-10.67.0.tgz ./localpack/sentry-opentelemetry-10.67.0.tgz \
            ./localpack/sentry-cloudflare-10.67.0.tgz ./localpack/sentry-server-utils-10.67.0.tgz \
            elysia mysql2 wrangler@4
PORT=52745 node $REPRO/_toolbox/sink.mjs > sink2.log 2>&1 &        # envelope sink
PORT=52742 node recorder.mjs   > recorder2.log 2>&1 &    # outgoing-fetch recorder
npx wrangler dev --port 52741 --inspector-port 0 > wrangler7.log 2>&1 &

# 3. @sentry/elysia + withSentry app
cd $D/elysia-sdk-probe
npm install $REPRO/_toolbox/pack/sentry-elysia-10.67.0.tgz $REPRO/_toolbox/pack/sentry-bun-10.67.0.tgz $REPRO/_toolbox/pack/sentry-node-10.67.0.tgz \
            $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
            $D/localpack/sentry-core-10.67.0.tgz $D/localpack/sentry-opentelemetry-10.67.0.tgz \
            $D/localpack/sentry-cloudflare-10.67.0.tgz $D/localpack/sentry-server-utils-10.67.0.tgz \
            elysia wrangler@4
npx wrangler dev --port 52744 --inspector-port 0 > wr3.log 2>&1 &

# 4. drive (toggle vars.TRACE_LIFECYCLE between "static" and "stream" in wrangler.jsonc)
curl -s -X DELETE http://127.0.0.1:52745/__items
curl -s -H 'sentry-trace: cccccccccccccccccccccccccccccccc-dddddddddddddddd-1' \
        -H 'baggage: sentry-trace_id=cccccccccccccccccccccccccccccccc,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' \
        http://127.0.0.1:52744/users/7
curl -s http://127.0.0.1:52744/fetch; curl -s http://127.0.0.1:52744/log
(curl -s http://127.0.0.1:52744/iso/alpha & curl -s http://127.0.0.1:52744/iso/beta & curl -s http://127.0.0.1:52744/iso/gamma & wait)
curl -s http://127.0.0.1:52744/p/9/boom
curl -s http://127.0.0.1:52744/sentinel          # sentinel, then read
sleep 6; curl -s http://127.0.0.1:52745/__items
curl -s http://127.0.0.1:52742/__hits            # sentry-trace / baggage on the outgoing fetch
```

Files: `elysia-sdk-probe/`, `localpack/`, `package-lock.json`, `package.json`, `rec.pid`, `rec2.pid`, `recorder.log`, `recorder.mjs`, `recorder2.log`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `src/`, `w1.pid`, `w2.pid`, `w3.pid`, `w4.pid`, `w5.pid`, `w6.pid`, `w7.pid`, `wrangler.jsonc`, `wrangler1.log`, `wrangler2.log`, `wrangler3.log`, `wrangler4.log`, `wrangler5.log`, `wrangler6.log`, `wrangler7.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | works | With `withElysia`, a throw in a handler is captured automatically via Elysia's global onError hook, mechanism `auto.http.elysia.on_error`, handled:false, correct trace id and transaction `GET /p/:id/boom` (traceLifecycle static and stream both). Without `withElysia`, Elysia swallows the error entirely: plain `withSentry(app.fetch)` produced only a transaction with status internal_error and NO event; a hand-written `.onError` hook calling `Sentry.captureException` is then required. |
| route names | works | With `withElysia` applied to the Elysia instance before routes are registered, the server transaction is `GET /users/:id` with source `route` (static lifecycle) and the streamed segment span is named `GET /users/:id` (stream lifecycle). Silent trap: if `withElysia(app)` is called AFTER the routes are declared, only the error path gets the route name (its onError hook), while the success path stays `GET /users/42` with source `url`. Plain `withSentry` alone is always `GET /users/42` / source `url` (static) or bare `GET` (stream). |
| isolation | works | Three concurrent GET /iso/{alpha,beta,gamma} each setTag('reqtag', ...) and captureException: each event carries only its own tag and its own trace id (8df5cf86..., 298f04fd..., b58f7a27...), and each has its own `GET /iso/:tag` transaction on the matching trace. Isolation comes from `withSentry`, not from `withElysia` (its `app.wrap` isolation branch is Bun-only). traceLifecycle static. |
| incoming trace | works | A request with `sentry-trace: cccccccccccccccccccccccccccccccc-dddddddddddddddd-1` plus baggage produced a transaction with trace_id `cccccccccccccccccccccccccccccccc` and parent_span_id `dddddddddddddddd`. Continued by `withSentry`; verified with both plain withSentry and withElysia. traceLifecycle static. |
| outgoing fetch | works | `fetch()` from inside an Elysia handler to a local recorder produced `http.client GET http://127.0.0.1:52742/recorded-sdk` as a child of the server transaction (static) / `http.client GET 127.0.0.1` with origin auto.http.fetch (stream), and the recorder saw `sentry-trace` and `baggage` whose trace id matched the server transaction. Comes from the Cloudflare SDK's fetch instrumentation. |
| db spans | broken | mysql2 does run on workerd from a module-scope pool, but only with `disableEval: true` (without it every query fails with `Code generation from strings disallowed for this context`); `SELECT * FROM users` returned both rows. No db span is emitted: the `GET /db` transaction had `spans: []`. Instrumentation path used: none, this was a plain wrangler/esbuild build, and no Bun plugin or Deno hook applies here. The Cloudflare Vite plugin's `buildTimeInstrumentation` path was NOT exercised (out of time box), so a Vite-built Worker may differ. |
| logs | works | `Sentry.logger.info('hello from withElysia handler', { where: 'cf' })` inside a handler arrived as a log envelope item `info: hello from withElysia handler`. Works with and without `withElysia`. traceLifecycle static. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
Elysia with default AOT on workerd (no Sentry involved), wrangler2.log:
  ✘ [ERROR] service core:user:m-elysia-cf: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope. To fix this error, perform this operation within a handler.
      at null.<anonymous> (worker.js:15:16) in eval
      at null.<anonymous> (index.js:20163:4) in composeGeneralHandler
      at null.<anonymous> (index.js:23286:37) in get fetch
  ✘ [ERROR] The Workers runtime failed to start.

--- Plain withSentry around app.fetch (no @sentry/elysia), traceLifecycle static ---
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"f4a69fd49eaf43ae90d56758a5062528","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"transaction","name":"GET /error","op":"http.server","source":"url","status":"internal_error","trace_id":"38f1be06781a4c2dbd57c365ba9322a6","sdk":"sentry.javascript.cloudflare","spans":[]}
  ^ no `event` item for GET /error: Elysia swallowed the throw.
{"type":"transaction","name":"GET /fetch","op":"http.server","source":"url","status":"ok","trace_id":"828ba51128264b9dabc805b4c99f4937","spans":["http.client GET http://127.0.0.1:52742/recorded"]}
{"type":"log","items":["info: hello from elysia handler"]}
recorder: {"url":"/recorded","sentryTrace":"828ba51128264b9dabc805b4c99f4937-9efe14e7d1a36daa-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=828ba51128264b9dabc805b4c99f4937,sentry-sampled=true,sentry-sample_rate=1"}
after adding a hand-written Elysia .onError hook:
{"type":"event","exception":"Error: elysia-cf-boom","mechanism":"elysia.onError","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"013042fb94834b57bc2940d9bd0f7108"}
db route (mysql2 module-scope pool, disableEval:true):
  HTTP 200 {"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
{"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"c15fc43acb3841f3a88586c63eef00eb","spans":[]}
  ^ no db span. Without disableEval the same route returned: HTTP 500 "Code generation from strings disallowed for this context"
stream lifecycle, plain withSentry:
{"type":"span","trace_id":"22a7d09dcf2a4b869ebb68fb7a9b7bb5","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}

--- withElysia(new Elysia({aot:false})) applied AFTER routes, static ---
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"8667b70f341d401c8b55322a592ef548","spans":[]}
{"type":"transaction","name":"GET /p/:id/boom","op":"http.server","source":"route","status":"internal_error","trace_id":"41d264c27fbb4bfaa61af8e30c513277"}
  ^ route naming only on the error path.

--- withElysia applied BEFORE routes, traceLifecycle static (recommended setup) ---
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"cccccccccccccccccccccccccccccccc","parent_span_id":"dddddddddddddddd","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"transaction","name":"GET /fetch","op":"http.server","source":"route","status":"ok","trace_id":"b6946397c58d4758918dbdba3f33f207","spans":["http.client GET http://127.0.0.1:52742/recorded-sdk"]}
{"type":"log","items":["info: hello from withElysia handler"]}
{"type":"event","exception":"Error: iso-alpha","mechanism":"generic","handled":true,"trace_id":"8df5cf863f6746eeb8835926f0792930","tags":{"reqtag":"alpha"}}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"8df5cf863f6746eeb8835926f0792930"}
{"type":"event","exception":"Error: iso-beta","mechanism":"generic","handled":true,"trace_id":"298f04fd623e481faee281bccd7b4d48","tags":{"reqtag":"beta"}}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"298f04fd623e481faee281bccd7b4d48"}
{"type":"event","exception":"Error: iso-gamma","mechanism":"generic","handled":true,"trace_id":"b58f7a27d3e247f199fd50a0d8d56e40","tags":{"reqtag":"gamma"}}
{"type":"transaction","name":"GET /iso/:tag","op":"http.server","source":"route","status":"ok","trace_id":"b58f7a27d3e247f199fd50a0d8d56e40"}
{"type":"event","exception":"Error: elysia-sdk-param-boom","mechanism":"auto.http.elysia.on_error","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","transaction":"GET /p/:id/boom","trace_id":"45315bdace9d45558bda62002f6e3018"}
{"type":"transaction","name":"GET /p/:id/boom","op":"http.server","source":"route","status":"internal_error","trace_id":"45315bdace9d45558bda62002f6e3018"}
recorder: {"url":"/recorded-sdk","sentryTrace":"b6946397c58d4758918dbdba3f33f207-920bc11924b777c8-1","baggage":"...sentry-trace_id=b6946397c58d4758918dbdba3f33f207,sentry-sampled=true,sentry-sample_rate=1"}

--- withElysia applied BEFORE routes, traceLifecycle stream ---
{"type":"span","trace_id":"e37716044243432cbaae54fec5a22ff8","items":["http.server GET /users/:id"],"raw":[{"name":"GET /users/:id","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","trace_id":"0e74a8815e3a42ea9a6c7ad8ffa2c95a","items":["http.client GET 127.0.0.1","http.server GET /fetch"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"b41b8f4acc2b7a2a","origin":"auto.http.fetch"},{"name":"GET /fetch","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","trace_id":"31e9bf03d75849cb9c59cdfc57a181eb","items":["http.server GET /p/:id/boom"],"raw":[{"name":"GET /p/:id/boom","status":"error","is_segment":true,"origin":"auto.http.cloudflare"}]}
```

## Docs note

No page mentions Elysia on Cloudflare Workers. ~/dev/sentry-docs/docs/platforms/javascript/guides/elysia/index.mdx:25 lists the prerequisites as "Bun or Node.js 18+ (with @elysiajs/node adapter)" only, and the install snippets are Bun/Node only (index.mdx:55-56, :82). ~/dev/sentry-docs/platform-includes/performance/what-instrumentation-provides/javascript.elysia.mdx:11-12 has a "Runtime Behavior" section that covers exactly two runtimes, Bun and Node.js, and says nothing about workerd. The Cloudflare guide's list of frameworks with dedicated setup instructions (~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/index.mdx:16-23: Astro, Hono, Hydrogen, Next.js, Nuxt, Remix, SvelteKit, TanStack Start) does not include Elysia, and `grep -rni elysia docs/platforms/javascript/guides/cloudflare/` returns nothing. So the combination that actually works today is undocumented in both directions, including the two things a user cannot guess: `aot: false` and wrapping with `withElysia` before declaring routes.
