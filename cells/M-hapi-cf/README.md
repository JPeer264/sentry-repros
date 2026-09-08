# M-hapi-cf: Hapi (@hapi/hapi 21) on cloudflare (workerd 1.20260903.1 via wrangler 4.129.0, compatibility_date 2026-05-01)

## What it reproduces

Three things a docs page for this combination would have to say, and none of them are written down anywhere today:

1. Hapi route handler errors are invisible on Cloudflare. `hapiIntegration()` from @sentry/server-utils is not in @sentry/cloudflare's default integration set and is not re-exported from @sentry/cloudflare, so a user must import it from @sentry/server-utils by hand. Even then it does not work: the integration subscribes to `orchestrion:@hapi/hapi:start` / `:initialize`, `attachHapiErrorHandler` does run (state flag confirmed true on `server.events`), but the `{name:'request', channels:['error']}` podium event that the handler listens for never fires under workerd. A plain listener I registered on the same event never fired either, so Hapi's deferred emit is being dropped by the Workers I/O context, not by Sentry. The only recipe that captures is an `onPreResponse` extension. Worth a Sentry-side decision: either document the extension, or have the hapi integration hook a synchronous path (e.g. the `ext`/`route` channel error context) instead of the podium event.

2. `sentryCloudflareVitePlugin()` breaks module-scope Hapi route registration. The injected `tr_ch_apm$route.start.runStores(...)` wrapper around `Server.prototype.route` starts a Sentry span, which generates random values, which workerd forbids in global scope. Every Hapi-on-Workers example on the internet registers routes at module scope, so adding the plugin turns a working Worker into one that fails to boot with a message that names neither Sentry nor Hapi. The same is likely true of any framework whose setup calls an injected channel at module scope. Control build without the Sentry plugin boots fine, so the plugin is the cause.

3. Package-resolution trap for anyone following a tarball/local-build workflow: `@sentry/cloudflare` imports `@sentry/server-utils/no-diagnostic-channels`, and npm happily resolves `@sentry/opentelemetry@10.67.0` from the registry (the released v10 build) next to a develop-built `@sentry/core@10.67.0`, which then fails the vite/esbuild bundle with `No matching export in "@sentry/core/build/esm/index.js" for import "spanShouldInferOtelSource"`. Both tarballs must be passed on the install command line.

Runtime facts worth recording elsewhere in the matrix: mysql2 is unusable on workerd ("Code generation from strings disallowed for this context") while mysql@2 works, including a module-scope pool reaching 127.0.0.1:3307. Hapi 21 itself needs nothing beyond `nodejs_compat` + `enable_nodejs_http_server_modules` and `httpServerHandler({ port })` - it booted and served parameterized routes on the very first try with no Sentry present.

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Hapi runs on Workers behind the node:http server shim. Two working shapes, they give different results.

A) Plain wrangler (esbuild) build - no framework instrumentation:
  npm install @hapi/hapi@21 mysql@2 wrangler@4 \
    $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
    $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz
  (all five @sentry tarballs are required: @sentry/cloudflare imports "@sentry/server-utils/no-diagnostic-channels", and npm otherwise resolves @sentry/opentelemetry@10.67.0 from the registry, which does not match the develop core build - see notes.)

  wrangler.jsonc:
    { "name": "m-hapi-cf", "main": "src/index.mjs",
      "compatibility_date": "2026-05-01",
      "compatibility_flags": ["nodejs_compat", "enable_nodejs_http_server_modules"] }

  src/index.mjs:
    import * as Sentry from '@sentry/cloudflare';
    import Hapi from '@hapi/hapi';
    import { httpServerHandler } from 'cloudflare:node';
    const server = Hapi.server({ port: 8080, host: '0.0.0.0' });
    server.route({ method: 'GET', path: '/users/{id}', handler: req => ({ id: req.params.id }) });
    // Hapi swallows handler throws, so capture them yourself:
    server.ext('onPreResponse', (request, h) => {
      const r = request.response;
      if (r && r.isBoom) Sentry.captureException(r, { mechanism: { type: 'hapi.onPreResponse', handled: false } });
      return h.continue;
    });
    await server.start();
    export default Sentry.withSentry(
      env => ({ dsn: '___PUBLIC_DSN___', tracesSampleRate: 1.0, traceLifecycle: 'static' }),
      httpServerHandler({ port: 8080 }),
    );
  Run: npx wrangler dev --port <port> --inspector-port 0

B) Vite build with sentryCloudflareVitePlugin - needed for Hapi route names and db spans:
  npm install vite@6 @cloudflare/vite-plugin   (plus everything from A)
  vite.config.mjs:
    import { cloudflare } from '@cloudflare/vite-plugin';
    import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
    export default { plugins: [cloudflare(), sentryCloudflareVitePlugin({ autoInstrumentation: false })] };
  Run: npx vite build && npx wrangler dev --config dist/<worker>/wrangler.json --port <port> --inspector-port 0

  IMPORTANT for B: routes must NOT be registered at module scope. With the Sentry Vite plugin active,
  a module-scope server.route(...) throws at isolate startup (see errors evidence). The entry has to
  defer route registration and server.start() into the first fetch:
    let started;
    const nodeHandler = httpServerHandler({ port: 8080 });
    export default Sentry.withSentry(cfg, {
      async fetch(request, env, ctx) {
        started ??= (async () => { registerRoutes(); await server.start(); })();
        await started;
        return nodeHandler.fetch(request, env, ctx);
      },
    });

  mysql: use mysql@2, not mysql2 (mysql2 dies on workerd, see db spans).
  All results below were taken with traceLifecycle: 'static'.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
cd $REPRO/cells/M-hapi-cf

# deps (node_modules was removed at the end to save disk; reinstall to rerun)
npm install --no-audit --no-fund @hapi/hapi@21 mysql@2 wrangler@4 vite@6 @cloudflare/vite-plugin \
  $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-server-utils-10.67.0.tgz $REPRO/_toolbox/pack/sentry-server-runtime-injection-10.67.0.tgz \
  $REPRO/_toolbox/pack/sentry-opentelemetry-10.67.0.tgz

# sink (extended copy of $REPRO/_toolbox/sink.mjs with /__record + /__recorded)
PORT=41778 node ./sink.mjs > sink.log 2>&1 & echo $! > sink.pid

# A) plain wrangler build
npx wrangler dev --port 41777 --inspector-port 0 > dev4.log 2>&1 & echo $! > dev4.pid

# B) vite build with the Sentry Cloudflare Vite plugin
npx vite build
npx wrangler dev --config dist/m_hapi_cf/wrangler.json --port 41780 --inspector-port 0 > dev8.log 2>&1 & echo $! > dev8.pid

# control: vite WITHOUT the Sentry plugin, module-scope routes
npx vite build -c vite.config.nosentry.mjs
npx wrangler dev --config dist-nosentry/m_hapi_cf_nosentry/wrangler.json --port 41781 --inspector-port 0 > dev9.log 2>&1 & echo $! > dev9.pid

# probes (PORT = 41777 for A, 41780 for B)
curl -s -X DELETE http://127.0.0.1:41778/__items
curl -s http://127.0.0.1:41780/users/42
curl -s -H 'sentry-trace: 1234567890abcdef1234567890abcdef-1122334455667788-1' \
        -H 'baggage: sentry-trace_id=1234567890abcdef1234567890abcdef,sentry-environment=probe,sentry-public_key=public,sentry-sample_rate=1,sentry-sampled=true' \
        http://127.0.0.1:41780/users/42
for t in alpha bravo charlie; do curl -s -o /dev/null http://127.0.0.1:41780/isolate/$t & done; wait
for p in /error/7 /error-ext/8 /fetch /db /log; do curl -s -o /dev/null http://127.0.0.1:41780$p; done
curl -s -o /dev/null http://127.0.0.1:41780/sentinel   # sentinel, then read
sleep 8; curl -s http://127.0.0.1:41778/__items; curl -s http://127.0.0.1:41778/__recorded
```

Files: `.dev.vars`, `dev1.log`, `dev1.pid`, `dev2.log`, `dev2.pid`, `dev3.log`, `dev3.pid`, `dev4.log`, `dev4.pid`, `dev5.log`, `dev5.pid`, `dev6.log`, `dev6.pid`, `dev7.log`, `dev7.pid`, `dev8.log`, `dev8.pid`, `dev9.log`, `dev9.pid`, `package-lock.json`, `package.json`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`, `src2/`, `vite.config.mjs`, `vite.config.nosentry.mjs`, `wrangler.jsonc`, `wrangler.nosentry.jsonc`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | broken | A throw in a Hapi route handler never reaches Sentry, on either build. Hapi converts it to a Boom 500; the worker fetch span records status internal_error but no exception event is emitted. Adding integrations: [hapiIntegration()] from @sentry/server-utils does install ("Integration installed: Hapi") and does attach its handler (server.events['__SENTRY_HAPI_ERROR_HANDLER_STATE__'] === true), but the Hapi request/error podium event never fires on workerd, so nothing is captured. I attached my own listener on the identical event ({name:'request', channels:['error']}) and it never fired either, so this is Hapi's deferred event emission dying in the Workers I/O context, not a Sentry bug. The only mechanism that works is a server.ext('onPreResponse') that calls Sentry.captureException on response.isBoom; that event carries the right trace id and full request data. |
| route names | partial | Plain wrangler/esbuild build: transaction name is the raw path, "GET /users/42", source url - the Cloudflare SDK names the request span and knows nothing about Hapi's router. With the Vite build (sentryCloudflareVitePlugin, buildTimeInstrumentation default on) the injected @hapi/hapi channels give "GET /users/{id}" with source route, plus a nested 'router GET /users/{id}' span and a 'middleware ext - onPreResponse' span. |
| isolation | works | Three concurrent GET /isolate/{tag} requests each did Sentry.setTag('req_tag', tag), slept 50-100ms, then captureException. Each event carried only its own tag and matched its own transaction's trace id. Verified on both builds; withSentry's per-invocation isolation scope propagates through httpServerHandler into the Hapi handler. |
| incoming trace | works | A request with sentry-trace 1234567890abcdef1234567890abcdef-1122334455667788-1 and a matching baggage header produced a transaction with trace_id 1234567890abcdef1234567890abcdef and parent_span_id 1122334455667788. Verified on both builds. |
| outgoing fetch | works | fetch() from inside a Hapi handler to a local recorder produced an 'http.client GET http://127.0.0.1:41778/__record' span nested in the request transaction, and the recorder saw sentry-trace and baggage with the same trace id as the transaction. Works on both builds (global fetch patching in @sentry/cloudflare, no Hapi involvement). |
| db spans | partial | Needed the Cloudflare Vite plugin (buildTimeInstrumentation, on by default). With it, a module-scope mysql@2 pool queried inside the handler produced 'db SELECT id, name FROM users' nested in the transaction. With the plain wrangler/esbuild build the same query ran fine but produced no span at all. mysql2/promise cannot be used on workerd: pool.query rejects with "Code generation from strings disallowed for this context" (mysql2 compiles row parsers with new Function). mysql@2 connects to 127.0.0.1:3307 from the Worker without any extra config. |
| logs | works | Sentry.logger.info('hapi-cf-log-from-handler', { where: 'handler' }) inside a route handler arrived as a log envelope item 'info: hapi-cf-log-from-handler' within the 7s flush window. Verified on both builds. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
--- Hapi boots on workerd with no Sentry at all (plain wrangler, module-scope routes) ---
[wrangler:info] Ready on http://localhost:41777
[wrangler:info] GET /ok 200 unknown (11ms)
[wrangler:info] GET /users/42 200 unknown (2ms)

--- A) plain wrangler build, sink /__items ---
transaction GET /ok        | op=http.server | source=url | sdk=sentry.javascript.cloudflare | spans=[]
transaction GET /users/42  | op=http.server | source=url | sdk=sentry.javascript.cloudflare | spans=[]
transaction GET /error/7   | op=http.server | source=url | status=internal_error | spans=[]      <- no event for the throw
event Error: hapi-cf-ext-boom | mechanism=hapi.onPreResponse | handled=false | trace=da08601b786a4fb6b598eb8f9d2faa4b
transaction GET /error-ext/8 | source=url | status=internal_error | trace=da08601b786a4fb6b598eb8f9d2faa4b
transaction GET /fetch | spans=['http.client GET http://127.0.0.1:41778/__record']
transaction GET /db    | spans=[]                                                                <- no db span
log ['info: hapi-cf-log-from-handler']

--- B) vite + sentryCloudflareVitePlugin, sink /__items ---
TX   GET /users/{id}     | source= route | trace= 1234567890abcdef1234567890abcdef | parent= 1122334455667788 | spans= ['router GET /users/{id}', 'middleware ext - onPreResponse']
EVT  Error: iso-alpha    | mech= generic handled= True | tags= {'req_tag': 'alpha'}   | trace= 6dce14ee7e8145ac85b38a17c476b792
TX   GET /isolate/{tag}  | source= route | trace= 6dce14ee7e8145ac85b38a17c476b792 | spans= ['router GET /isolate/{tag}', 'middleware ext - onPreResponse']
EVT  Error: iso-charlie  | mech= generic handled= True | tags= {'req_tag': 'charlie'} | trace= 44346db7efc14e3cb3099eb7d0f538ed
TX   GET /isolate/{tag}  | source= route | trace= 44346db7efc14e3cb3099eb7d0f538ed
EVT  Error: iso-bravo    | mech= generic handled= True | tags= {'req_tag': 'bravo'}   | trace= da4366f50d0f41cb86d44fd98b11095b
TX   GET /isolate/{tag}  | source= route | trace= da4366f50d0f41cb86d44fd98b11095b
EVT  Error: hapi-cf-ext-boom | mech= hapi.onPreResponse handled= False | trace= 39a0506f654b4c7d92aa979af5d04f3f
TX   GET /error-ext/{id} | source= route | trace= 39a0506f654b4c7d92aa979af5d04f3f | spans= ['router GET /error-ext/{id}', 'middleware ext - onPreResponse']
TX   GET /fetch | source= route | spans= ['router GET /fetch', 'http.client GET http://127.0.0.1:41778/__record', 'middleware ext - onPreResponse']
TX   GET /db    | source= route | spans= ['router GET /db', 'db SELECT id, name FROM users', 'middleware ext - onPreResponse']
LOG  ['info: hapi-cf-log-from-handler']
recorder: {"url":"/__record?from=hapi-cf","sentry-trace":"fad6626ba9f840b5984c99608aa78953-9b6f0d4cf243ccae-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=fad6626ba9f840b5984c99608aa78953,sentry-transaction=GET%20%2Ffetch,sentry-sampled=true,sentry-sample_rand=0.649237708028198,sentry-sample_rate=1"}

--- B) with hapiIntegration() explicitly added: attaches, but never captures ---
Sentry Logger [log]: [instrumentation:@hapi/hapi] "@hapi/hapi" already injected, subscribing now
Sentry Logger [log]: [instrumentation:@hapi/hapi] subscribing to channels
Sentry Logger [log]: Integration installed: Hapi
Sentry Logger [log]: Integration installed: Mysql
APP started; sentry error handler attached = true
[wrangler:info] GET /error/7 500 unknown (22ms)
(sink after two GET /error/7 requests)
transaction GET /error/{id} None
transaction GET /error/{id} None
(my own server.events.on({name:'request',channels:['error']}) listener printed nothing)

--- B) module-scope server.route() crashes the isolate when the Sentry Vite plugin is on ---
✘ [ERROR] service core:user:m-hapi-cf: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope. To fix this error, perform this operation within a handler. https://developers.cloudflare.com/workers/runtime-apis/handlers/
    at null.<anonymous> (index.js:63917:38) in route
    at null.<anonymous> (index.js:74880:8)
index.js:63917 is the injected wrapper: `return tr_ch_apm$route.start.runStores(__apm$ctx, () => {`
Control: the same module-scope-routes entry built with vite + @cloudflare/vite-plugin but WITHOUT sentryCloudflareVitePlugin boots and serves fine:
  [wrangler:info] Ready on http://localhost:41781
  $ curl http://127.0.0.1:41781/users/9  ->  {"id":"9"} [200]

--- mysql2 on workerd ---
$ curl http://127.0.0.1:41777/db
{"dberror":"Code generation from strings disallowed for this context"} [200]
```

## Docs note

No page in ~/dev/sentry-docs mentions Hapi on Cloudflare. The Hapi guide is Node-only by declaration: docs/platforms/javascript/guides/hapi/index.mdx:4-5 sets `sdk: sentry.javascript.node` and `fallbackGuide: javascript.node`, and its whole body is `<PlatformContent includePath="getting-started-node" />` (index.mdx:12). The Cloudflare guide's framework list has no hapi page - docs/platforms/javascript/guides/cloudflare/frameworks/ holds only astro, hono, hydrogen-react-router, hydrogen-remix, nextjs, nuxt, remix, sveltekit, tanstack-start. Nothing under docs/platforms/javascript/guides/cloudflare/ mentions hapi at all (grep -ril hapi returns nothing), and nothing mentions `enable_nodejs_http_server_modules` or `httpServerHandler` (grep over the guide dir returns only nodejs_compat hits). The one page that is load-bearing for this cell, docs/platforms/javascript/guides/cloudflare/features/vite-plugin.mdx, is also stale against develop: line 6 says `<AvailableSince version="10.68.0" />`, and lines 29-46 tell users to opt in with `sentryCloudflareVitePlugin({ _experimental: { useDiagnosticsChannelInjection: true } })`, while the develop build's vite types expose only top-level `autoInstrumentation` and `buildTimeInstrumentation` (node_modules/@sentry/cloudflare/build/types/vite/index.d.ts), both already on by default.
