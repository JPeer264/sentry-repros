# M-express-cf: Express 5 (express@5.2.0) behind `httpServerHandler` from `cloudflare:node` on Cloudflare Workers (workerd 2026-09-03 via wrangler 4.129.0, compatibility_date 2026-05-01, flags `nodejs_compat` + `enable_nodejs_http_server_modules`), @sentry/cloudflare 10.67.0 (develop, tarball)

## What it reproduces

Headline: Express 5 runs on Workers today and the develop @sentry/cloudflare SDK covers it better than expected — async context propagates cleanly through the `cloudflare:node` httpServerHandler bridge, so isolation, trace continuation, scope tags and child spans all work inside express handlers with no extra wiring. But two things stand between this and a docs page.

1. BUG (blocking): with the Cloudflare Vite plugin's default `buildTimeInstrumentation: true`, the canonical Express entry — `app.get(...)` and `app.listen()` at module scope, exactly what every Express docs page shows — crashes the Worker at startup with `Disallowed operation called within global scope … generating random values are not allowed within global scope`. The injected wrapper around `Router.prototype.route` finds live channel subscribers during module evaluation and runs the Sentry subscriber (which mints a span id) at global scope. Confirmed by a control build: the same top-level entry with `sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })` boots fine, and the same entry under plain `wrangler dev` boots fine. Workaround used here is to defer `express()` + route registration + `listen()` into the first request. Either the express subscriber must not start a span for route registration, or `route`/`Router.prototype[method]` should not be an instrumented operation at all.

2. Sharp cliff between the two run shapes. Plain `wrangler dev` gives raw-URL transaction names (`GET /users/42`, source `url`) and silently swallows every route error — the only signal is a transaction with `status: internal_error` and no event. That is the shape a user lands on if they follow the Cloudflare quickstart and add express themselves. Everything good (route templates, `handler` spans, automatic `auto.http.express` error capture, db spans) requires Vite + the Sentry plugin. A docs page must lead with the Vite shape.

Smaller observations:
- mysql2 needs `disableEval: true` to run on workerd at all (`EvalError: Code generation from strings disallowed for this context`). Unrelated to Sentry but any db example on this runtime has to say so.
- Under traceLifecycle 'stream' the http.server span carries `http.route: /users/:id` but no `sentry.source` attribute at all; the name is already parameterized, so this may be intentional, flagging it for the span-name owner.
- `vite build` emits an `assets` entry that makes `wrangler dev --config dist/.../wrangler.json` fail with `The directory specified by the "assets.directory" field … does not exist: dist/client` on a rebuild-triggered reload. Creating an empty `dist/client` works around it. Possibly a @cloudflare/vite-plugin quirk for asset-less workers, not a Sentry issue.
- Not tested: `wrapRequestHandler` from `@sentry/cloudflare/request` (withSentry was enough), Durable Objects, deployed (non-local) workerd.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Express 5 boots on workerd unchanged and Sentry wires up in one place. Two shapes, and the difference matters a lot.

PACKAGES
  npm install express@5 wrangler@4 mysql2 vite@6 @cloudflare/vite-plugin
  npm install $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
              $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz

wrangler.jsonc
  {
    "name": "m-express-cf",
    "main": "src/index.js",
    "compatibility_date": "2026-05-01",
    "compatibility_flags": ["nodejs_compat", "enable_nodejs_http_server_modules"]
  }

SHAPE A - plain `wrangler dev` (esbuild). Entry file:
  import { httpServerHandler } from 'cloudflare:node';
  import * as Sentry from '@sentry/cloudflare';
  import express from 'express';

  const app = express();
  app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));
  // Required on this shape: express swallows route errors, nothing reaches Sentry without it.
  app.use((err, req, res, _next) => { Sentry.captureException(err); res.status(500).json({ error: err.message }); });
  app.listen(8080);

  export default Sentry.withSentry(
    () => ({ dsn: '...', tracesSampleRate: 1.0, traceLifecycle: 'static' }),
    httpServerHandler({ port: 8080 }),
  );

  Run: npx wrangler dev --port <port> --inspector-port 0
  Gets: errors (manual only), isolation, incoming trace, http.client spans + headers, logs.
  Does NOT get: parameterized route names (source stays `url`), express handler spans, db spans.

SHAPE B - Vite + `sentryCloudflareVitePlugin()` (the shape that actually gives express/db instrumentation):
  vite.config.mjs
    import { cloudflare } from '@cloudflare/vite-plugin';
    import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
    export default defineConfig({ plugins: [cloudflare(), sentryCloudflareVitePlugin()] });

  The entry MUST NOT register routes at module scope. With `buildTimeInstrumentation` on (the default)
  the injected express channel makes `app.get(...)` at global scope crash the Worker at startup, so the
  app has to be built lazily on the first request:

    let app, listening;
    function ensureApp() {
      if (!listening) { app = buildApp(); listening = new Promise(r => app.listen(8080, r)); }
      return listening;
    }
    const inner = httpServerHandler({ port: 8080 });
    export default Sentry.withSentry(() => ({ dsn, tracesSampleRate: 1.0 }), {
      async fetch(request, env, ctx) { await ensureApp(); return inner.fetch(request, env, ctx); },
    });

  Run: npx vite build && npx wrangler dev --config dist/<worker>/wrangler.json --port <port> --inspector-port 0
  Gets everything Shape A gets, plus automatic error capture (`auto.http.express`, handled:false),
  `GET /users/:id` with source `route`, `handler /users/:id` spans, and mysql2 db spans.

mysql2 on workerd additionally needs `disableEval: true` on the connection options; without it every query
fails with `EvalError: Code generation from strings disallowed for this context`.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
All from $SCRATCH/deep/M-express-cf
(S=$SCRATCH)

npm install express@5 wrangler@4 mysql2 vite@6 @cloudflare/vite-plugin
npm install $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz

PORT=41338 node $REPRO/_toolbox/sink.mjs > sink.log 2>&1 &     # envelope sink
node recorder.mjs > recorder.log 2>&1 &              # header recorder on 41339

# Shape A - plain wrangler
npx wrangler dev --port 41337 --inspector-port 0

# Shape B - vite build + build-time instrumentation
npx vite build
mkdir -p dist/client   # wrangler complains about a missing assets.directory otherwise
npx wrangler dev --config dist/m_express_cf/wrangler.json --port 41342 --inspector-port 0

# control (top-level routes, no build-time instrumentation)
npx vite build --config vite.config.b.mjs
npx wrangler dev --config distb/m_express_cf_b/wrangler.json --port 41343 --inspector-port 0

# probes
curl -s http://127.0.0.1:41342/users/42
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:41342/boom
curl -s http://127.0.0.1:41342/db
curl -s http://127.0.0.1:41342/fetchout
curl -s http://127.0.0.1:41342/logit
(curl -s "http://127.0.0.1:41342/tagged?tag=alpha&delay=600" & curl -s "http://127.0.0.1:41342/tagged?tag=beta&delay=300" & curl -s "http://127.0.0.1:41342/tagged?tag=gamma&delay=50" & wait)
curl -s -H "sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1" -H "baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-public_key=public,sentry-environment=upstream,sentry-sampled=true,sentry-sample_rate=1" "http://127.0.0.1:41342/users/7"
curl -s http://127.0.0.1:41342/sentinel        # sentinel, always last
curl -s http://127.0.0.1:41338/__items         # compact envelopes
curl -s "http://127.0.0.1:41338/__items?raw"   # raw payloads (span attributes)
curl -s http://127.0.0.1:41339/__seen          # propagation headers seen by the recorder
curl -s -X DELETE http://127.0.0.1:41338/__items
```

Files: `REPRO.md`, `package-lock.json`, `package.json`, `rec.pid`, `recorder.log`, `recorder.mjs`, `sink.log`, `sink.pid`, `src/`, `srcb/`, `vite.config.b.mjs`, `vite.config.mjs`, `w1.pid`, `w2.pid`, `w3.pid`, `w4.pid`, `wb.pid`, `wrangler.b.jsonc`, `wrangler.jsonc`, `wrangler1.log`, `wrangler2.log`, `wrangler3.log`, `wrangler4.log`, `wranglerb.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | partial | Shape B (Vite plugin): a throw in `app.get('/boom')` is captured automatically as `Error: express-cf-boom` with `mechanism: auto.http.express, handled: false`, and the server span gets `status: internal_error`; express still answers 500 to the client. Shape A (plain wrangler dev): express swallows it completely, no event at all reaches the sink, only `transaction GET /boom status=internal_error` — you must add an express error middleware calling `Sentry.captureException(err)`, which then arrives as `mechanism: generic, handled: true`. Both results from traceLifecycle 'static'. |
| route names | partial | Shape A: the server transaction is named from the raw URL, `GET /users/42` with `source: url` (high cardinality, no route template). Shape B: `GET /users/:id` with `source: route` under traceLifecycle 'static', and under 'stream' the same `http.server GET /users/:id` span with `http.route: /users/:id` and `sentry.origin: auto.http.cloudflare`. Note the stream-lifecycle span carries `http.route` but no `sentry.source` attribute at all. |
| isolation | works | Three concurrent GET /tagged requests with 600/300/50 ms awaits inside the handler each produced exactly their own tag pair and their own trace id: gamma/beta/alpha never leaked across events, and each error's trace id matched its own transaction. Verified identically on Shape A and Shape B, traceLifecycle 'static'. The async context established by `withSentry` propagates through the `cloudflare:node` httpServerHandler bridge into express handlers, including across `setTimeout`. |
| incoming trace | works | A request with `sentry-trace: aaaa…aaaa-bbbbbbbbbbbbbbbb-1` plus baggage produced a transaction with `trace_id: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` and `parent_span_id: bbbbbbbbbbbbbbbb`, and `Sentry.getActiveSpan()` inside the express handler reported the same trace id. Works on both shapes, traceLifecycle 'static'. |
| outgoing fetch | works | `fetch('http://127.0.0.1:41339/recorder')` from inside an express handler produced a child span `http.client GET http://127.0.0.1:41339/recorder` on the server transaction, and the recorder saw `sentry-trace: <same trace id>-87f72dabd083db4a-1` plus a full baggage header (environment, public_key, trace_id, sampled, sample_rand, sample_rate). Works on both shapes, traceLifecycle 'static'. |
| db spans | partial | Instrumentation path: the Cloudflare Vite plugin (`sentryCloudflareVitePlugin()`, `buildTimeInstrumentation` default true), and it was required. With it, a module-scope `import mysql from 'mysql2/promise'` and a query inside the handler yields `db mysql2.connect` and `db SELECT id, name FROM users` ('static') / `db SELECT users` ('stream'). Under plain `wrangler dev` (esbuild, no channel injection) the identical code produces zero db spans. Separately, mysql2 only runs on workerd at all with `disableEval: true`; the default path dies with `EvalError: Code generation from strings disallowed for this context`. |
| logs | works | `Sentry.logger.info('express-cf-log', { where: 'route' })` inside a handler arrived as a log envelope `info: express-cf-log` on both shapes, on the default (always-on) logging with no `enableLogs` option. Flushed on the timer, visible after ~7s. |
| client errors | not-run | No browser surface: this is a server-only Express Worker, there is no client bundle or browser SDK in the app. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
--- Shape A, plain `wrangler dev` (traceLifecycle 'static') ---
transaction | GET /plain     | op=http.server source=url status=ok
transaction | GET /users/42  | op=http.server source=url status=ok           <-- raw URL, not /users/:id
transaction | GET /boom      | op=http.server source=url status=internal_error   (NO event alongside it)

after adding `app.use((err,req,res,next) => Sentry.captureException(err))`:
event | Error: express-cf-boom | mechanism=generic handled=true trace=c23a26ae552049a6b87bbabb6afc3f4b
        request.url=http://127.0.0.1:41337/boom method=GET user.ip_address=127.0.0.1
transaction | GET /boom | source=url status=internal_error trace=c23a26ae552049a6b87bbabb6afc3f4b

isolation (3 concurrent /tagged, 600/300/50 ms awaits):
event Error: tagged-gamma tags={"probe_tag":"gamma","probe_tag2":"gamma"} trace=fe3ce03bf0654dc990a1fbef7aa41022
transaction GET /tagged                                                    trace=fe3ce03bf0654dc990a1fbef7aa41022
event Error: tagged-beta  tags={"probe_tag":"beta","probe_tag2":"beta"}   trace=b75128e7bde948f6b85e5cdecf6c6432
transaction GET /tagged                                                    trace=b75128e7bde948f6b85e5cdecf6c6432
event Error: tagged-alpha tags={"probe_tag":"alpha","probe_tag2":"alpha"} trace=e744378e9ea54d4cbdbb8bf6057a46c4
transaction GET /tagged                                                    trace=e744378e9ea54d4cbdbb8bf6057a46c4

incoming trace:
transaction | GET /tagged | trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa parent=bbbbbbbbbbbbbbbb source=url

outgoing fetch:
transaction | GET /fetchout | spans=["http.client GET http://127.0.0.1:41339/recorder"]
recorder: {"url":"/recorder","headers":{"sentry-trace":"8792da6cdf7d4fb4be816a8d7c1d0f1a-87f72dabd083db4a-1",
  "baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=8792da6cdf7d4fb4be816a8d7c1d0f1a,sentry-sampled=true,sentry-sample_rand=0.392523267510307,sentry-sample_rate=1"}}

logs:
log | ["info: express-cf-log"]

db, Shape A (module-scope mysql2 import, module already loaded before the request):
{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
transaction | GET /db | spans=[]                                            <-- no db span

db, Shape A without disableEval:
{"dbError":"EvalError: Code generation from strings disallowed for this context\n    at .../.wrangler/tmp/dev-YML9e4/index.js:55840:31"}

--- Shape B, `vite build` + sentryCloudflareVitePlugin() (traceLifecycle 'static') ---
transaction | GET /db          | source=route | spans=["handler /db","db mysql2.connect","db SELECT id, name FROM users"]
transaction | GET /users/:id   | source=route | spans=["handler /users/:id"]
event       | Error: express-cf-boom | mech=auto.http.express handled=false     (NO manual error middleware)
transaction | GET /boom        | source=route | status=internal_error | spans=["handler /boom"]
transaction | GET /fetchout    | source=route | spans=["handler /fetchout","http.client GET http://127.0.0.1:41339/recorder"]
log         | ["info: express-cf-log"]
transaction | GET /users/:id   | trace=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa parent=bbbbbbbbbbbbbbbb source=route
event Error: tagged-gamma tags={"probe_tag":"gamma","probe_tag2":"gamma"} trace=c56a36818cb745c2a2507d6df4c41635
event Error: tagged-beta  tags={"probe_tag":"beta","probe_tag2":"beta"}   trace=43788cdf670042d3ba34657829a23918
event Error: tagged-alpha tags={"probe_tag":"alpha","probe_tag2":"alpha"} trace=29124da79e4b406490e3c1177ea89a15

--- Shape B, traceLifecycle 'stream' ---
span | ["db mysql2.connect","db SELECT users","handler /db","http.server GET /db"]
span | ["handler /users/:id","http.server GET /users/:id"]
raw attributes on the server span:
GET /users/:id | sentry.source= undefined | sentry.origin= auto.http.cloudflare | http.route= /users/:id

--- Shape B with the ordinary docs-shaped entry (top-level app.get + app.listen): Worker will not boot ---
Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()),
setting a timeout, and generating random values are not allowed within global scope. To fix this error,
perform this operation within a handler. https://developers.cloudflare.com/workers/runtime-apis/handlers/
  at index.js:58784:37 in route2
  at index.js:59102:26 in route2
  at index.js:59165:27 in app2.<computed>
  at index.js:78150:5
(index.js:58784 is `return tr_ch_apm$register.start.runStores(__apm$ctx, () => {` inside the injected
wrapper around express's `Router.prototype.route`.)

--- control: same top-level entry, sentryCloudflareVitePlugin({ buildTimeInstrumentation: false }) ---
[wrangler:info] Ready on http://localhost:41343
plain:200
```

## Docs note

No page in ~/dev/sentry-docs mentions Express on Cloudflare Workers. Grepping the express guide (~/dev/sentry-docs/docs/platforms/javascript/guides/express/) for "cloudflare", "workerd" or "edge runtime" returns nothing; the guide's front matter at docs/platforms/javascript/guides/express/index.mdx:3 pins `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and categories `server-node`, i.e. it assumes Node. Grepping the whole cloudflare guide (docs/platforms/javascript/guides/cloudflare/) for "express" returns nothing, and docs/platforms/javascript/guides/cloudflare/frameworks/index.mdx:3 scopes that section to "Sentry meta-framework SDKs like SvelteKit or Remix" — the frameworks directory holds only astro, hono, hydrogen-react-router, hydrogen-remix, nextjs, nuxt, remix, sveltekit, tanstack-start. Nothing anywhere in the docs repo mentions `httpServerHandler` or `enable_nodejs_http_server_modules` (grep -rln over ~/dev/sentry-docs returns no files), so the whole node:http-server-on-workerd story is undocumented, not just Express.
