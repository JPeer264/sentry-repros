# M-oak-cf: Oak 17.2.0 (@oak/oak from JSR, installed as npm:@jsr/oak__oak@17.2.0) on Cloudflare Workers (wrangler 4.129.0 / workerd 1.20260903.1, compatibility_date 2026-05-01, nodejs_compat)

## What it reproduces

Packaging is the real story here. Oak's current line (17.x) ships only to JSR; the npm package @oakserver/oak is stuck at 14.1.0. Any docs page must show the `@jsr:registry=https://npm.jsr.io` .npmrc line plus the `npm:@jsr/oak__oak` alias, otherwise a user following it installs a three-major-versions-old Oak.

Oak needs zero adaptation for Workers: Application.fetch is documented in Oak's own source as a Cloudflare fetch handler and takes (request, env, ctx). Everything @sentry/cloudflare provides at the withSentry layer therefore works unchanged, which is why six of seven capabilities are green with no Sentry-side Oak support at all.

The one real gap is route names. Because Sentry only sees the Worker fetch boundary, a parameterized Oak route is reported as the raw URL (static lifecycle) or as bare "GET" (stream lifecycle). Oak exposes matched layers on ctx.matched, so an ~8-line middleware fixes it, but two things make that workaround imperfect and worth an SDK-side fix or at least a documented snippet: setting the sentry.source attribute after updateSpanName is honoured in stream lifecycle (source "route") but not in static lifecycle (source stays "custom"); and the middleware runs after `await next()`, so on a throwing route it never executes and the error transaction keeps the unparameterized name.

A second reportable wart: a request that throws out of the handler still produces a server transaction/span with status "ok", even though the error event is captured and the response is a 500.

The db result contradicts the assumption that Cloudflare db spans need the Vite plugin's buildTimeInstrumentation. Both mysql@2 (origin auto.db.mysql) and mysql2 (origin auto.db.mysql2.diagnostic_channel) emitted spans under plain `wrangler dev` with no Vite plugin present; mysql2 publishes diagnostics_channel events itself and the mysql@2 path is patch-based. The vite build with a bare sentryCloudflareVitePlugin() also succeeded (1495 modules, ~4MB worker) and produced identical spans, so the plugin is optional here.

Separately, mysql2 cannot actually execute a query on workerd: it compiles row parsers with `new Function`, which workerd rejects with `EvalError: Code generation from strings disallowed for this context`. Sentry still reports the span (status error). Any Cloudflare + MySQL guidance should point at mysql@2, not mysql2.

The @sentry/server-utils resolution trap cost the first build attempt: npm happily satisfies @sentry/server-utils@10.67.0 from the public registry, and that build lacks the ./no-diagnostic-channels export that @sentry/cloudflare's workflows.js imports. Every @sentry/* tarball has to be on the same npm install line.

Housekeeping: sink (pid file sink.pid/sink2.pid) and all wrangler dev processes were killed, and the 322MB node_modules was removed.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Oak's current line ships only to JSR; the npm package @oakserver/oak stops at 14.1.0. Install Oak 17 through the JSR npm bridge.

.npmrc:
  @jsr:registry=https://npm.jsr.io

Install:
  npm install '@oak/oak@npm:@jsr/oak__oak@17.2.0' wrangler@4 \
    $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz

@sentry/server-utils must come from the same worktree tarball. If npm resolves @sentry/server-utils@10.67.0 from the public registry, the wrangler build dies with: Could not resolve "@sentry/server-utils/no-diagnostic-channels" ... The path "./no-diagnostic-channels" is not exported by package "@sentry/server-utils".

wrangler.jsonc:
  { "name": "m-oak-cf", "main": "src/index.ts",
    "compatibility_date": "2026-05-01", "compatibility_flags": ["nodejs_compat"] }

src/index.ts (the entry shape a docs page would show):
  import { Application, Router } from '@oak/oak';
  import * as Sentry from '@sentry/cloudflare';

  const router = new Router();
  router.get('/users/:id', ctx => { ctx.response.body = { id: ctx.params.id }; });

  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  export default Sentry.withSentry(
    env => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 1.0 }),
    {
      fetch(request, env, ctx) { return app.fetch(request, env, ctx); },
    } satisfies ExportedHandler,
  );

Oak documents Application.fetch as a Cloudflare fetch handler itself (node_modules/@oak/oak/application.js:287-302), so no adapter is needed. No Sentry Oak integration exists; withSentry alone is the whole wiring.

Run: npx wrangler dev --port <port> --inspector-port 0

Optional, only if you want parameterized transaction names, an Oak middleware registered before router.routes():
  app.use(async (ctx, next) => {
    await next();
    const matched = ctx.matched;
    const path = matched?.[matched.length - 1]?.path;
    const span = Sentry.getActiveSpan();
    if (path && span) {
      Sentry.updateSpanName(Sentry.getRootSpan(span), `${ctx.request.method} ${path}`);
      Sentry.getRootSpan(span).setAttribute('sentry.source', 'route');
    }
  });

No Vite build is required for anything, including db spans.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
mkdir -p $REPRO/cells/M-oak-cf && cd $REPRO/cells/M-oak-cf
echo '{ "name": "m-oak-cf", "private": true, "type": "module", "version": "0.0.0" }' > package.json
echo '@jsr:registry=https://npm.jsr.io' > .npmrc
npm install --no-audit --no-fund '@oak/oak@npm:@jsr/oak__oak@17.2.0' wrangler@4 mysql@2 mysql2 \
  $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
# npm here gates install scripts; wrangler needs the workerd + esbuild binaries:
(cd node_modules/workerd && node install.js); (cd node_modules/esbuild && node install.js)

PORT=41538 node $REPRO/cells/M-oak-cf/sink.mjs > sink.log 2>&1 & sinkpid=$!
npx wrangler dev --port 41537 --inspector-port 0 > wrangler.log 2>&1 & wrpid=$!

curl -s http://127.0.0.1:41537/users/42
curl -s -o /dev/null http://127.0.0.1:41537/error/7
for t in alpha bravo charlie; do curl -s "http://127.0.0.1:41537/isolate/$t" & done; wait
TID=aaaaaaaabbbbccccddddeeeeffff0001; SID=1111222233334444
curl -s -H "sentry-trace: $TID-$SID-1" \
     -H "baggage: sentry-trace_id=$TID,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true" \
     -o /dev/null http://127.0.0.1:41537/error/9
curl -s http://127.0.0.1:41537/fetch
curl -s http://127.0.0.1:41537/log
curl -s http://127.0.0.1:41537/db1          # mysql@2
curl -s -o /dev/null http://127.0.0.1:41537/db   # mysql2
curl -s http://127.0.0.1:41537/sentinel     # sentinel, then read the sink
sleep 4; curl -s http://127.0.0.1:41538/__items; curl -s http://127.0.0.1:41538/__recorded

# stream lifecycle: set "vars": { "SENTRY_LIFECYCLE": "stream" } in wrangler.jsonc and restart
# optional Vite variant (not required for any capability):
npx vite build && npx wrangler dev --config dist/m_oak_cf/wrangler.json --port 41537 --inspector-port 0

kill $wrpid; kill $sinkpid
```

Files: `.npmrc`, `package-lock.json`, `package.json`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `sink2.pid`, `src/`, `vite.config.ts`, `wr1.pid`, `wr2.pid`, `wr3.pid`, `wr4.pid`, `wr5.pid`, `wr6.pid`, `wr7.pid`, `wr8.pid`, `wrangler.jsonc`, `wrangler.jsonc.bak`, `wrangler.jsonc.bak2`, `wrangler1.log`, `wrangler2.log`, `wrangler3.log`, `wrangler4.log`, `wrangler5.log`, `wrangler6.log`, `wrangler7.log`, `wrangler8.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | works | Oak does NOT swallow a handler throw: Application.fetch rethrows, workerd renders its default 500 stack page, and withSentry captures the error with mechanism auto.http.cloudflare, handled:false. Same in both lifecycles. One wart: the server transaction/span is still reported with status "ok" even though the request threw. |
| route names | broken | Out of the box the parameterized route is never used. traceLifecycle static gives name "GET /users/42" with source "url" (raw path, high cardinality); traceLifecycle stream gives "GET" (method only). A hand-written Oak middleware reading ctx.matched and calling updateSpanName produces "GET /users/:id" with source "route" in stream lifecycle but only source "custom" in static lifecycle, and it never runs on the error path because the throw skips the code after await next(). |
| isolation | works | Three concurrent GET /isolate/:tag requests, each awaiting a random 50-100ms, produced three events carrying exactly their own req_tag and three distinct trace ids, each matching its own server transaction. traceLifecycle static. |
| incoming trace | works | A request with sentry-trace aaaaaaaabbbbccccddddeeeeffff0001-1111222233334444-1 and matching baggage produced a transaction with trace_id aaaaaaaabbbbccccddddeeeeffff0001 and parent_span_id 1111222233334444; the error captured in that handler carried the same trace id. traceLifecycle static. |
| outgoing fetch | works | A plain global fetch from inside an Oak handler to the local recorder produced a child span "http.client GET http://127.0.0.1:41538/__record" (origin auto.http.fetch), and the recorder received sentry-trace 5f23912c0ff64e42a883a6a6c4e03dd6-a2dc7e1adcf6986d-1 plus a full baggage header. Seen in both static and stream lifecycles. |
| db spans | works | Module-scope pools. mysql@2 produced "db SELECT users" (origin auto.db.mysql, status ok) nested under the Oak server span, with real rows returned. mysql2@3 produced spans too (mysql2.pool.connect, mysql2.connect, SELECT users, origin auto.db.mysql2.diagnostic_channel) but the query itself fails on workerd with EvalError: Code generation from strings disallowed for this context, so its SELECT span has status error. Instrumentation path: none needed. Both drivers emitted spans under plain wrangler dev (esbuild bundling) with no Cloudflare Vite plugin; a vite build with sentryCloudflareVitePlugin() also works and changes nothing. traceLifecycle stream. |
| logs | works | Sentry.logger.info('oak-log-from-handler', { where: 'handler' }) inside an Oak handler arrived as a log envelope within the 7s flush window. traceLifecycle static. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
# viable, no Sentry (wrangler1.log + curl)
[wrangler:info] Ready on http://localhost:41537
{"ok":true}
{"id":"42"}

# errors + default route naming, traceLifecycle static
{"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","status":"ok","trace_id":"93c3011db5a94670bc03971227f309d8","sdk":"sentry.javascript.cloudflare","spans":[]}
{"type":"transaction","name":"GET /error/7","op":"http.server","source":"url","status":"ok","trace_id":"ce016677de0045558b893f04ed6c23dd","spans":[]}
{"type":"event","exception":"Error: oak-route-boom","mechanism":"auto.http.cloudflare","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","trace_id":"ce016677de0045558b893f04ed6c23dd"}

# error is not swallowed by Oak: workerd default 500 page
HTTP/1.1 500
Error: oak-route-boom
    at Application.fetch (.../node_modules/@oak/oak/application.ts:720:30)
    at Object.fetch (.../src/index.ts:57:18)

# isolation, 3 concurrent requests
{"exc":"Error: iso-charlie","tags":{"req_tag":"charlie"},"trace_id":"51a027addcc142bfb7020b53e3215fc6"}
{"t":"transaction","name":"GET /isolate/charlie","trace_id":"51a027addcc142bfb7020b53e3215fc6"}
{"exc":"Error: iso-bravo","tags":{"req_tag":"bravo"},"trace_id":"f0903166e4044abfaaa669bd48cbd372"}
{"t":"transaction","name":"GET /isolate/bravo","trace_id":"f0903166e4044abfaaa669bd48cbd372"}
{"exc":"Error: iso-alpha","tags":{"req_tag":"alpha"},"trace_id":"0dacb131776940cfbd0aa1a334d23a7f"}
{"t":"transaction","name":"GET /isolate/alpha","trace_id":"0dacb131776940cfbd0aa1a334d23a7f"}

# incoming trace continuation
{"type":"transaction","name":"GET /error/9","source":"url","trace_id":"aaaaaaaabbbbccccddddeeeeffff0001","parent_span_id":"1111222233334444","sdk":"sentry.javascript.cloudflare"}

# outgoing fetch span + propagated headers
{"type":"transaction","name":"GET /fetch","op":"http.server","source":"url","trace_id":"5f23912c0ff64e42a883a6a6c4e03dd6","spans":["http.client GET http://127.0.0.1:41538/__record"]}
[{"url":"/__record?from=oak","sentry-trace":"5f23912c0ff64e42a883a6a6c4e03dd6-a2dc7e1adcf6986d-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=5f23912c0ff64e42a883a6a6c4e03dd6,sentry-sampled=true,sentry-sample_rand=0.6472434135561002,sentry-sample_rate=1"}]

# logs
{"type":"log","items":["info: oak-log-from-handler"]}

# route name with the ctx.matched middleware, traceLifecycle static
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"custom","status":"ok","trace_id":"aed639d7d812407da7b795d46b87e022","spans":[]}

# traceLifecycle stream: with middleware vs on the error path (middleware never ran)
{"type":"span","trace_id":"0cfad9e6aa5b47d78ab1737c3969dc63","items":["http.server GET /users/:id"],"raw":[{"name":"GET /users/:id","status":"ok","is_segment":true,"origin":"auto.http.cloudflare","source":"route"}]}
{"type":"span","trace_id":"468969f3733f4d6c85845a87fb18ece1","items":["http.server GET"],"raw":[{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}

# db spans, mysql@2, plain wrangler dev (no Vite plugin)
{"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}]}
{"type":"span","trace_id":"3d371dbe0d6440e6959edc11d1634e97","items":["db SELECT users","http.server GET /db1"],"raw":[{"name":"SELECT users","status":"ok","parent_span_id":"bd884c2cc72f0df2","is_segment":false,"origin":"auto.db.mysql"},{"name":"GET /db1","status":"ok","is_segment":true,"origin":"auto.http.cloudflare","source":"route"}]}

# db spans, mysql2@3: spans fire, driver itself cannot run on workerd
EvalError: Code generation from strings disallowed for this context
{"type":"span","trace_id":"cf2510c9cca846f1909aa77d51bb98f5","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET"],"raw":[{"name":"mysql2.pool.connect","status":"ok","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"mysql2.connect","status":"ok","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"SELECT users","status":"error","origin":"auto.db.mysql2.diagnostic_channel"},{"name":"GET","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}

# build failure when @sentry/server-utils comes from the public registry instead of the worktree tarball
✘ [ERROR] Could not resolve "@sentry/server-utils/no-diagnostic-channels"
    node_modules/@sentry/cloudflare/build/esm/prod/workflows.js:4:57
    The path "./no-diagnostic-channels" is not exported by package "@sentry/server-utils"
```

## Docs note

No page anywhere in ~/dev/sentry-docs mentions Oak. `grep -ril "\boak\b" ~/dev/sentry-docs/docs` returns nothing, and `grep -ril "oak" ~/dev/sentry-docs/docs/platforms/javascript/ ~/dev/sentry-docs/platform-includes/` returns nothing. The Cloudflare guide's framework directory (~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/frameworks/) contains only astro.mdx, hono.mdx, hydrogen-react-router.mdx, hydrogen-remix.mdx, index.mdx, nextjs.mdx, nuxt.mdx, remix.mdx, sveltekit.mdx, tanstack-start.mdx. There is no Oak guide on any runtime, so nothing documents this combination today.
