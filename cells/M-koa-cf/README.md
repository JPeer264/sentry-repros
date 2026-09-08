# M-koa-cf: Koa 3.2.1 + @koa/router (plain node:http server behind cloudflare:node httpServerHandler), @sentry/cloudflare 10.67.0 from develop on Cloudflare Workers (wrangler 4.129.0 dev / workerd 1.20260903.1, compatibility_date 2026-05-01, compatibility_flags nodejs_compat + enable_nodejs_http_server_modules)

## What it reproduces

Two findings that are not about a single capability:

1. `sentryCloudflareVitePlugin()` with its default `buildTimeInstrumentation: true` makes a node:http/`httpServerHandler` worker fail to start on workerd ("Disallowed operation called within global scope"). Bisected across four builds; it is not mysql-specific and not `ssr.noExternal`-specific. This removes the only db-span path on Cloudflare for any framework of this shape (Koa, Express, Fastify behind httpServerHandler), so db spans here are broken rather than merely absent.

2. Installing the develop tarballs partially is a trap. `npm install sentry-cloudflare.tgz sentry-core.tgz` alone makes npm resolve `@sentry/server-utils` and `@sentry/opentelemetry` from the registry at the same 10.67.0 version, and the resulting mix fails the wrangler esbuild step with `Could not resolve "@sentry/server-utils/no-diagnostic-channels"` and six missing `@sentry/core` exports. All five tarballs (cloudflare, core, server-utils, server-runtime-injection, opentelemetry) must be on one command line.

Positive surprise worth recording: AsyncLocalStorage propagates cleanly across the `httpServerHandler` -> node:http bridge. `Sentry.getActiveSpan()`, `Sentry.setTag`, `Sentry.captureException` and `Sentry.logger` all resolve to the correct per-request isolation scope inside Koa middleware, and captured events carry the Worker's request data. That is what makes errors, isolation, incoming trace, outgoing fetch and logs all work here despite there being zero Koa-specific instrumentation.

The two real gaps a docs page would have to call out are (a) `app.on('error', ...)` is mandatory or Koa eats every handler error, and (b) there are no route names, so the user must call `Sentry.updateSpanName(Sentry.getRootSpan(Sentry.getActiveSpan()), `${ctx.method} ${ctx._matchedRoute}`)` themselves, which gives source `custom`, not `route`.

Environment notes: wrangler writes `.wrangler/deploy/config.json` after a `vite build` and silently redirects later plain `wrangler dev` runs to the last dist output - this cost one confusing round of 404s before I spotted it. `client errors` is marked not-run because the app has no browser surface. All processes were killed and `node_modules` (308M) was removed; probe sources, configs and wrangler logs remain.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Koa runs on workerd unchanged once `enable_nodejs_http_server_modules` is on. Verified first WITHOUT Sentry (GET / -> {"ok":true}, GET /users/42 -> {"id":"42"}).

Packages: `npm install koa@3 @koa/router wrangler@4 $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz`
IMPORTANT: you must pass the `server-utils` AND `opentelemetry` tarballs too. Installing only the cloudflare + core tarballs makes npm pull the *published* 10.67.0 of those two, and esbuild then fails the wrangler build with `Could not resolve "@sentry/server-utils/no-diagnostic-channels"` and six `No matching export in "@sentry/core/build/esm/index.js" for import "SEMANTIC_ATTRIBUTE_SENTRY_SOURCE" / "SPAN_KIND" / "spanShouldInferOtelSource" / "spanSourceWasExplicitlySet" / "markSpanForOtelSourceInference" / "_INTERNAL_startInactiveSpan"`.

wrangler.jsonc:
```
{ "name": "koa-cf-probe", "main": "src/index.js",
  "compatibility_date": "2026-05-01",
  "compatibility_flags": ["nodejs_compat", "enable_nodejs_http_server_modules"] }
```

Entry (src/index.js) - there is no separate instrument file; `withSentry` wraps the object `httpServerHandler` returns:
```js
import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';
import mysql from 'mysql';

const conn = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

const app = new Koa();
const router = new Router();
router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });

// REQUIRED, otherwise every handler error is silently swallowed
app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } }));

app.use(router.routes()).use(router.allowedMethods());
app.listen(8080);

export default Sentry.withSentry(
  env => ({ dsn: '...', tracesSampleRate: 1.0 }),   // add traceLifecycle: 'static' for transaction envelopes
  httpServerHandler({ port: 8080 }),
);
```
Run: `npx wrangler dev --port <port> --inspector-port 0`.

Do NOT add `sentryCloudflareVitePlugin()`: with its default `buildTimeInstrumentation: true` the Koa worker no longer boots at all (see db spans).

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
D=$REPRO/cells/M-koa-cf

# install (node_modules was deleted at the end to save disk - rerun this first)
cd $D && npm install --no-audit --no-fund koa@3 @koa/router wrangler@4 vite@6 @cloudflare/vite-plugin mysql@2 \
  $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz

# sink + local fetch recorder
PORT=41318 node $REPRO/_toolbox/sink.mjs > $D/sink.log 2>&1 &
cd $D && nohup node recorder.mjs > $D/rec4.log 2>&1 &        # listens on 41337

# viability without Sentry
cd $D && npx wrangler dev --config wrangler.bare.jsonc --port 41317 --inspector-port 0

# main probe, stream lifecycle (default)
cd $D && npx wrangler dev --port 41321 --inspector-port 0
# main probe, static lifecycle
cd $D && npx wrangler dev --port 41377 --inspector-port 0 --var TRACE_LIFECYCLE:static

curl -s http://127.0.0.1:41321/users/42
curl -s http://127.0.0.1:41321/named/9
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:41321/boom/7
for t in alpha beta gamma; do curl -s http://127.0.0.1:41321/tag/$t & done; wait
curl -s -H 'sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1' \
     -H 'baggage: sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' \
     http://127.0.0.1:41321/users/99
curl -s http://127.0.0.1:41321/outgoing ; curl -s http://127.0.0.1:41337/__hits
curl -s http://127.0.0.1:41321/log ; curl -s http://127.0.0.1:41321/db
curl -s http://127.0.0.1:41321/sentinel        # sentinel, then read the sink
curl -s http://127.0.0.1:41318/__items | python3 -m json.tool
curl -s 'http://127.0.0.1:41318/__items?raw' | python3 -m json.tool   # full span attributes

# db-span / Vite-plugin bisect
cd $D && npx vite build -c vite.bare.config.mjs   && npx wrangler dev --config dist/koa_cf_bare/wrangler.json  --port 41357 --inspector-port 0  # bare Koa via Vite: boots
cd $D && npx vite build -c vite.bare2.config.mjs  && npx wrangler dev --config dist/koa_cf_bare2/wrangler.json --port 41359 --inspector-port 0  # + withSentry, no Sentry plugin: boots
cd $D && npx vite build -c vite.bare3.config.mjs  && npx wrangler dev --config dist/koa_cf_bare2/wrangler.json --port 41361 --inspector-port 0  # + sentryCloudflareVitePlugin: FAILS
cd $D && npx vite build -c vite.bare4.config.mjs  && npx wrangler dev --config dist/koa_cf_bare2/wrangler.json --port 41363 --inspector-port 0  # + buildTimeInstrumentation:false: boots

# NOTE: after any `vite build`, $D/.wrangler/deploy/config.json redirects plain `wrangler dev`
# to the last dist/ output. Reset it before rerunning the plain probe:
echo '{"configPath":"../../wrangler.jsonc"}' > $D/.wrangler/deploy/config.json
```

Files: `bare/`, `bare2/`, `db.out`, `nodb/`, `package-lock.json`, `package.json`, `plain/`, `rec.log`, `rec.pid`, `rec2.log`, `rec2.pid`, `rec3.log`, `rec3.pid`, `rec4.log`, `rec4.pid`, `recorder.mjs`, `recorder.mjs.bak`, `sink.log`, `sink.pid`, `src/`, `vite.bare.config.mjs`, `vite.bare2.config.mjs`, `vite.bare3.config.mjs`, `vite.bare4.config.mjs`, `vite.config.mjs`, `vite.nodb.config.mjs`, `w1.pid`, `w2.pid`, `w3.pid`, `w4.pid`, `w5.pid`, `w6.pid`, `w7.pid`, `w8.pid`, `w9.pid`, `wA.pid`, `wB.pid`, `wC.pid`, `wD.pid`, `wE.pid`, `wF.pid`, `wG.pid`, `wH.pid`, `wI.pid`, `wrangler.bare.jsonc`, `wrangler.bare2.jsonc`, `wrangler.jsonc`, `wrangler.nodb.jsonc`, `wrangler1.log`, `wrangler2.log`, `wrangler3.log`, `wrangler4.log`, `wrangler5.log`, `wrangler6.log`, `wrangler7.log`, `wrangler8.log`, `wrangler9.log`, `wranglerA.log`, `wranglerB.log`, `wranglerC.log`, `wranglerD.log`, `wranglerE.log`, `wranglerG.log`, `wranglerH.log`, `wranglerI.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | partial | Koa swallows the error by default: with no `app.on('error')` handler, a `throw` in `router.get('/boom/:id')` returns 500 and the server span gets `status: "error"`, but NO event ever reaches Sentry. Adding `app.on('error', err => Sentry.captureException(err, {mechanism:{type:'koa.onerror',handled:false}}))` (Koa's own idiom) makes it arrive, with sdk `sentry.javascript.cloudflare`, full request data (url/method/headers), and the same trace id as the request span, so the manual capture is correctly scoped to the request. There is no automatic mechanism, so the mechanism type is whatever the user writes. `hasContextLine` is false. Same under stream and static lifecycle; under static the transaction gets `status: "internal_error"`. |
| route names | broken | No route name at all. @koa/router is not instrumented on Cloudflare, and the Worker-level `HttpServer` integration never sees the matched route. Stream lifecycle: `GET /users/42` produces a segment named just `GET` with `sentry.segment.name.source = "url"` and no `http.route` attribute. Static lifecycle: `transaction: "GET /users/42"`, `source: "url"` - the raw path, so high cardinality. Manual naming does work from inside a Koa handler: `Sentry.updateSpanName(Sentry.getRootSpan(Sentry.getActiveSpan()), `${ctx.method} ${ctx._matchedRoute}`)` yields `GET /named/:id` with source `custom` in both lifecycles. That `Sentry.getActiveSpan()` returns the request span inside the Koa handler also proves the AsyncLocalStorage context survives the httpServerHandler -> node:http bridge. |
| isolation | works | Three concurrent `GET /tag/{alpha,beta,gamma}` requests, each doing `Sentry.setTag('reqtag', t)`, then an async sleep of 30-90ms, then `captureException`. Each event carried exactly its own tag and a distinct trace id that matched its own request span (alpha 45f08af3..., beta 6c7d0af5..., gamma 11046bde...). No cross-talk. withSentry's per-request isolation scope reaches through into the Koa middleware chain. Stream lifecycle. |
| incoming trace | works | `GET /users/99` with `sentry-trace: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1` plus a matching baggage header produced a segment span with `trace_id: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` and `parent_span_id: bbbbbbbbbbbbbbbb`. Stream lifecycle. |
| outgoing fetch | works | `fetch('http://127.0.0.1:41337/rec')` from inside a Koa handler produced an `http.client` child span with `origin: auto.http.fetch` (stream: `http.client GET 127.0.0.1`, parent = the server segment; static: the transaction's `spans` contains `http.client GET http://127.0.0.1:41337/rec`). The local recorder saw both propagation headers: `sentry-trace: ad8f621d61c04419a70a413f4c9a6c77-83d9c7bf8af874b9-1` and a full `baggage` with trace_id/sampled/sample_rate. |
| db spans | broken | The query itself works: a MODULE-SCOPE `mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',database:'app'})` queried from a handler returned real MariaDB rows (`{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}`) under plain `wrangler dev`, but emitted zero db spans (static lifecycle transaction `GET /db` came back with `"spans": []`). The only instrumentation path on Cloudflare is the Cloudflare Vite plugin's `buildTimeInstrumentation`, and it is fatal here: `vite build` with `sentryCloudflareVitePlugin({autoInstrumentation:false})` does inject the channel (the bundle contains `orchestrion:mysql:query` twice, and grows 987kB -> 2.99MB) but workerd then refuses to start the worker with `Uncaught Error: Disallowed operation called within global scope`. Bisected: bare Koa through Vite + @cloudflare/vite-plugin boots; + `@sentry/cloudflare` and `withSentry` (no Sentry Vite plugin) boots; + `sentryCloudflareVitePlugin({autoInstrumentation:false})` fails; + `sentryCloudflareVitePlugin({autoInstrumentation:false, buildTimeInstrumentation:false})` boots again. So `buildTimeInstrumentation: true` (the default) is what breaks a node:http/httpServerHandler worker, independent of mysql (the mysql-free variant fails identically) and independent of `ssr.noExternal`. mysql2's own diagnostics channels are not an escape hatch: `mysql2-dc-subscriber` exists in @sentry/server-utils but is not in @sentry/cloudflare's default integration list (observed `sentry.sdk.integrations`: Dedupe, EventFilters, FunctionToString, ConversationId, LinkedErrors, Fetch, HttpServer, RequestData, Console, SpanStreaming). |
| logs | works | `Sentry.logger.info('koa-cf log line', { where: 'handler' })` inside a Koa handler arrived as a log envelope: `{"type": "log", "items": ["info: koa-cf log line"]}`. Read after a 7-9s wait plus a captureMessage sentinel. Stream lifecycle. |
| client errors | not-run | No browser surface: this is a server-only Koa app on workerd, there is no client bundle and no @sentry/browser in play. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
Koa boots on workerd with NO Sentry (viability check, wrangler1.log / curl):
  {"ok":true}
  {"id":"42"}

Errors WITHOUT app.on('error') - event missing, only the failed span:
  {"type":"span","trace_id":"7bb52418bae54f6992ce19b0130059c1","items":["http.server GET"],"raw":[{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.cloudflare"}]}

Errors WITH app.on('error') (stream):
  {"type":"event","exception":"Error: koa-cf boom","mechanism":"koa.onerror","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"trace_id":"0b112b45208b49d7ba91ed62bb70446c","request":{"url":"http://127.0.0.1:41321/boom/7","method":"GET"}}
  {"type":"span","trace_id":"0b112b45208b49d7ba91ed62bb70446c","items":["http.server GET"],"raw":[{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.cloudflare"}]}
static:
  {"type":"transaction","name":"GET /boom/7","op":"http.server","source":"url","status":"internal_error","trace_id":"74f7945afeb341d48f1c764320029e41","spans":[]}

Route names - default (stream) for GET /users/42:
  {"type":"span","trace_id":"a9328dbfd00041be853cf09dbf31c9dd","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
  attributes: "sentry.segment.name":"GET", "sentry.segment.name.source":"url", "url.path":"/users/42"   (no http.route)
static:
  {"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","spans":[]}
after manual updateSpanName:
  {"type":"span","trace_id":"e9b559d531b04834917b71454fa23fc6","items":["http.server GET /named/:id"],"raw":[{"name":"GET /named/:id","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
  attributes: "sentry.segment.name":"GET /named/:id", "sentry.segment.name.source":"custom"
  {"type":"transaction","name":"GET /named/:id","op":"http.server","source":"custom","status":"ok"}

Isolation - 3 concurrent /tag/* requests:
  {"type":"event","exception":"Error: tagged-alpha","tags":{"reqtag":"alpha"},"trace_id":"45f08af398bb488d9555b74c01a10c41","request":{"url":"http://127.0.0.1:41321/tag/alpha"}}
  {"type":"span","trace_id":"45f08af398bb488d9555b74c01a10c41","items":["http.server GET"]}
  {"type":"event","exception":"Error: tagged-beta","tags":{"reqtag":"beta"},"trace_id":"6c7d0af54ecc4b7e8249f310ef864755"}
  {"type":"span","trace_id":"6c7d0af54ecc4b7e8249f310ef864755","items":["http.server GET"]}
  {"type":"event","exception":"Error: tagged-gamma","tags":{"reqtag":"gamma"},"trace_id":"11046bde2e4b48288829d5fb2640602d"}
  {"type":"span","trace_id":"11046bde2e4b48288829d5fb2640602d","items":["http.server GET"]}

Incoming trace (sentry-trace aaaa...-bbbbbbbbbbbbbbbb-1):
  {"type":"span","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","parent_span_id":"bbbbbbbbbbbbbbbb","is_segment":true,"origin":"auto.http.cloudflare"}]}

Outgoing fetch (stream):
  {"type":"span","trace_id":"8e8ed407eae046369c31f1ee940b281c","items":["http.client GET 127.0.0.1","http.server GET"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"92d2c1211f9a7761","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
static:
  {"type":"transaction","name":"GET /outgoing","op":"http.server","source":"url","status":"ok","spans":["http.client GET http://127.0.0.1:41337/rec"]}
recorder /__hits:
  [{"url":"/rec","sentryTrace":"ad8f621d61c04419a70a413f4c9a6c77-83d9c7bf8af874b9-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=ad8f621d61c04419a70a413f4c9a6c77,sentry-sampled=true,sentry-sample_rand=0.85448792154495,sentry-sample_rate=1"}]

DB - query succeeds, no span (static, plain wrangler dev, module-scope connection):
  GET /db -> {"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
  {"type":"transaction","name":"GET /db","op":"http.server","source":"url","status":"ok","trace_id":"5e97d7812cc14538a93fa1772d478e17","spans":[],"hasRequestData":false}
DB - the only instrumentation path kills the worker (wranglerC.log, with sentryCloudflareVitePlugin default buildTimeInstrumentation):
  ✘ [ERROR] service core:user:koa-cf-bare2: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope. To fix this error, perform this operation within a handler.
  ✘ [ERROR] The Workers runtime failed to start. There was likely a problem with the workerd binary or your configuration.
  (same build with buildTimeInstrumentation:false, wranglerD.log: "[wrangler:info] Ready on http://localhost:41363")

Logs:
  {"type":"log","items":["info: koa-cf log line"]}

Install-shape failure when the server-utils/opentelemetry tarballs are omitted (wrangler2.log / wrangler3.log):
  ✘ [ERROR] Could not resolve "@sentry/server-utils/no-diagnostic-channels"  (node_modules/@sentry/cloudflare/build/esm/prod/workflows.js:4:57)
  ✘ [ERROR] No matching export in "node_modules/@sentry/core/build/esm/index.js" for import "spanShouldInferOtelSource"  (node_modules/@sentry/opentelemetry/build/esm/asyncContextStrategy-CL7X6mXf.js)
```

## Docs note

No page in ~/dev/sentry-docs mentions Koa on Cloudflare, and nothing in the docs mentions the mechanism this cell depends on. `grep -rin koa docs/platforms/javascript/guides/cloudflare/` returns nothing; `grep -rin "cloudflare\|workerd" docs/platforms/javascript/guides/koa/` returns nothing; `grep -rin "httpServerHandler\|enable_nodejs_http_server_modules" docs/ platform-includes/` returns nothing at all. The Koa guide is a 12-line stub (docs/platforms/javascript/guides/koa/index.mdx:1-12) declaring `sdk: sentry.javascript.node` and `fallbackGuide: javascript.node`, i.e. it sends the reader to @sentry/node, which is not what runs here. docs/platforms/javascript/guides/cloudflare/frameworks/ lists only astro, hono, hydrogen-react-router, hydrogen-remix, nextjs, nuxt, remix, sveltekit, tanstack-start - no Koa and no generic "node:http server on Workers" page. Separately, docs/platforms/javascript/guides/cloudflare/index.mdx:63 tells readers to import from `@sentry/cloudflare/nodejs_compat`, an entrypoint that does not exist on develop.
