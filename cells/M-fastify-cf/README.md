# M-fastify-cf: Fastify 5.12.3 (find-my-way 9.9.0 router) on Cloudflare Workers (wrangler 4.x dev / workerd 1.20260903.1, compatibility_date 2026-05-01, compatibility_flags ["nodejs_compat", "enable_nodejs_http_server_modules"], httpServerHandler from cloudflare:node)

## What it reproduces

The blocker is workerd's ban on dynamic code generation, a platform invariant with no compatibility flag. It is not a Sentry issue and not a wiring issue. Fastify's router (find-my-way) compiles path matchers, params builders and constraint deriving with `new Function` at route-registration time, so `app.get('/users/:id', ...)` throws before any request is served. Fastify 4 (find-my-way 7.7.0) has the same four call sites, so downgrading is not an escape. Fastify would additionally hit the same wall in `ajv` (schema validation) and `fast-json-stringify` (response serialization) as soon as any route schema is declared.

A nuance worth recording for the other Cloudflare cells: `enable_nodejs_http_server_modules` + `httpServerHandler` itself works fine on this workerd (the control worker served 200s), but most Node frameworks cannot be constructed at module scope, because workerd forbids random-value generation, timers and async I/O in global scope. The lazy-boot-on-first-fetch pattern in app/src/index.mjs is the general workaround for that first failure and is worth reusing in the Express/Hapi/Nest Cloudflare cells.

I did not install or test 10.73.0. @sentry/cloudflare 10.67.0 from $REPRO/_toolbox/pack was installed but never initialized, since the app never served a request, so no sink or recorder was started. All processes I started were killed and both node_modules trees were removed; the wrangler/workerd processes still running on this machine belong to other agents' cells (M-express-cf, M-nestjs-cf, M-oak-cf, M-hapi-cf).

This directory is the original run of 2026-09-06 and 2026-09-07, kept as it was. This README was generated from the recorded result; the rebuilt cells carry a hand-written README.

## Setup the docs would show

Not viable. No wiring exists that makes Fastify serve a request on workerd, so there is nothing a docs page could show. Two independent workerd restrictions block it, in this order:

1) `const app = Fastify()` at module scope throws "Disallowed operation called within global scope" (Fastify's boot sequence generates random values / schedules work). This one IS workaroundable, by constructing the app lazily on the first request:

   let booting;
   function boot() {
     if (!booting) booting = (async () => { const app = Fastify(); app.get('/users/:id', ...); await app.listen({ port: 8080, host: '127.0.0.1' }); })();
     return booting;
   }
   const nodeHandler = httpServerHandler({ port: 8080 });
   export default { async fetch(req, env, ctx) { await boot(); return nodeHandler.fetch(req, env, ctx); } };

2) With that in place, registering ANY route throws `EvalError: Code generation from strings disallowed for this context`. Fastify's router `find-my-way` compiles matchers with `new Function` in four unconditional places, with no non-eval fallback:
   node_modules/find-my-way/lib/node.js:220            (StaticNode._compilePrefixMatch)
   node_modules/find-my-way/lib/handler-storage.js:78  (params object builder)
   node_modules/find-my-way/lib/handler-storage.js:171 (_getHandlerMatchingConstraints)
   node_modules/find-my-way/lib/constrainer.js:172     (deriveSyncConstraints)
   Workers forbid dynamic code generation at runtime and there is no compatibility flag that lifts it, so this is a hard wall, not a configuration problem. Downgrading does not help: find-my-way 7.7.0 (Fastify 4) has the same four `new Function` call sites.

Control test proves the Cloudflare half of the shape is fine: the same wrangler config with a plain `node:http` server behind `httpServerHandler({ port: 8081 })` serves `GET /users/42` with 200 and the correct body. So the blocker is Fastify's router specifically, not `enable_nodejs_http_server_modules`.

@sentry/cloudflare was installed ($REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz + sentry-core) but never wired, because the app never served a request. The intended wiring would have been `export default withSentry(env => ({ dsn, tracesSampleRate: 1.0, tunnel: 'http://127.0.0.1:<port>/' }), { async fetch(req, env, ctx) { await boot(); return nodeHandler.fetch(req, env, ctx); } })`.

## Install and Run

Recorded commands; paths under `$SCRATCH` were the session working directory, the same files are in this directory:

```
S=$SCRATCH
mkdir -p $REPRO/cells/M-fastify-cf/app && cd $REPRO/cells/M-fastify-cf/app
npm install --no-audit --no-fund fastify@5 mysql@2 wrangler@4 \
  $REPRO/_toolbox/pack/sentry-cloudflare-10.67.0.tgz $REPRO/_toolbox/pack/sentry-core-10.67.0.tgz

# Fastify worker (fails)
npx wrangler dev --port 47313 --inspector-port 0        # uses wrangler.jsonc -> src/index.mjs
curl -s http://127.0.0.1:47313/users/42
curl -s http://127.0.0.1:47313/ping

# Control worker (node:http behind httpServerHandler, succeeds)
npx wrangler dev --config wrangler-control.jsonc --port 47314 --inspector-port 0
curl -s http://127.0.0.1:47314/users/42

# Fastify 4 router check
mkdir -p $REPRO/cells/M-fastify-cf/fmwcheck && cd $REPRO/cells/M-fastify-cf/fmwcheck
echo '{"name":"c","private":true}' > package.json
npm install find-my-way@7
grep -rn "new Function" node_modules/find-my-way/lib/*.js
```

Files: `app/`, `fmwcheck/`, `wr1.pid`, `wr2.pid`, `wr3.pid`, `wrangler-control.log`, `wrangler1.log`, `wrangler2.log`

## Expected

| Capability | Verdict | Detail |
| --- | --- | --- |
| errors | not-run | Fastify never serves a request on workerd: route registration throws EvalError before any handler can run, so no error can be thrown from a handler in the first place. No Sentry init was performed. |
| route names | not-run | `/users/:id` cannot be registered at all. `app.get('/users/:id', ...)` is exactly the call that throws `EvalError: Code generation from strings disallowed for this context` from find-my-way's `_compilePrefixMatch`. |
| isolation | not-run | No request ever reaches a handler, so no scope isolation can be observed. |
| incoming trace | not-run | No request ever reaches a handler; every request to the Fastify worker returns 500 with the EvalError. |
| outgoing fetch | not-run | No handler runs, so no outgoing fetch is made. Cloudflare's own http.client instrumentation is untestable here because the framework never gets to call fetch. |
| db spans | not-run | mysql@2 was installed but never imported into a working worker. No instrumentation path (Cloudflare Vite plugin or otherwise) was exercised, because the framework itself does not boot. |
| logs | not-run | Sentry was never initialized in a running worker, so no log envelopes could be produced. |

## Observed

Not re-run in the rebuild. The recorded evidence of the original run:

```
# 1. Fastify() at module scope, wrangler dev startup (wrangler1.log)
✘ [ERROR] service core:user:fastify-cf: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope. To fix this error, perform this operation within a handler.
    at null.<anonymous> (index.js:34099:21) in fastify
    at null.<anonymous> (index.js:34567:38)
✘ [ERROR] The Workers runtime failed to start.

# 2. Lazy boot inside fetch(): worker starts, but every request 500s (wrangler2.log)
[wrangler:info] Ready on http://localhost:47313
[wrangler:error] EvalError: Code generation from strings disallowed for this context
    at _StaticNode._compilePrefixMatch (.../node_modules/find-my-way/lib/node.js:220:24)
    at new StaticNode (.../node_modules/find-my-way/lib/node.js:111:10)
    at _StaticNode.createStaticChild (.../node_modules/find-my-way/lib/node.js:98:18)
    at Router._on (.../node_modules/find-my-way/index.js:200:33)
    at Router.on (.../node_modules/find-my-way/index.js:146:10)
    at Object.addNewRoute (.../node_modules/fastify/lib/route.js:361:16)
    at Object.route (.../node_modules/fastify/lib/route.js:269:19)
    at Object.prepareRoute (.../node_modules/fastify/lib/route.js:168:18)
    at Object._get [as get] (.../node_modules/fastify/fastify.js:185:34)
[wrangler:info] GET /users/42 500 Internal Server Error (62ms)
[wrangler:info] GET /ping 500 Internal Server Error (16ms)

# 3. Control worker: same flags, plain node:http server behind httpServerHandler -> works; new Function still banned
[wrangler:info] Ready on http://localhost:47314
$ curl -s http://127.0.0.1:47314/users/42
{"url":"/users/42","newFunction":"EvalError: Code generation from strings disallowed for this context"}

# 4. Same eval dependency in the Fastify 4 router line
$ grep -rn "new Function" node_modules/find-my-way/lib/*.js   # find-my-way 7.7.0
lib/constrainer.js:168:    this.deriveSyncConstraints = new Function('req', 'ctx', lines.join('\n')).bind(this)
lib/node.js:200:    this.matchPrefix = new Function('path', 'i', `return ${lines.join(' && ')}`)
lib/handler-storage.js:68:    return new Function('paramsArray', `return {${lines.join(',')}}`)
lib/handler-storage.js:160:    this._getHandlerMatchingConstraints = new Function('derivedConstraints', lines.join('\n'))
```

## Docs note

No page in ~/dev/sentry-docs mentions Fastify on Cloudflare. `grep -rni "cloudflare|workerd|worker" ~/dev/sentry-docs/docs/platforms/javascript/guides/fastify/` returns zero hits, and `grep -rni "fastify" ~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/` returns zero hits. The Cloudflare guide's own list of supported frameworks (~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/index.mdx:16-24) names Astro, Hono, Hydrogen, Next.js, Nuxt, Remix, SvelteKit and TanStack Start, and does not include Fastify or any other Node HTTP framework. The only places the two strings co-occur are `<PlatformSection>` supported/notSupported attribute lists in common docs (for example ~/dev/sentry-docs/docs/platforms/javascript/common/tracing/index.mdx:58 and ~/dev/sentry-docs/docs/platforms/javascript/common/logs/index.mdx:212), which list `javascript.fastify` and `javascript.cloudflare` as separate sibling platforms, never as a combination. Nothing needs adding or correcting: the combination is impossible and the docs correctly do not claim it.
