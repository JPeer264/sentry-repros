# verify4-M-koa-cf-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-koa-cf` (see `$REPRO/cells/M-koa-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `install.log`, `package-lock.json`, `package.json`, `sink.log`, `sink.pid`, `src/`, `src2/`, `src3/`, `vite.config.mjs`, `vite.config.stream.mjs`, `vite.config.top.mjs`, `vite.koaexternal.config.mjs`, `vite.lazy.config.mjs`, `vite1.log`, `vite2.log`, `vite3.log`, `wA.log`, `wA.pid`, `wB.pid`, `wC.pid`, `wD.pid`, `wE.pid`, `wStream.log`, `wStream.pid`, `wTop.log`, `wTop.pid`, `wrangler.dctest.jsonc`, `wrangler.jsonc`, `wrangler.lazy.jsonc`, `wrangler.stream.jsonc`, `wrangler.top.jsonc`, `wranglerA.log`, `wranglerB.log`, `wranglerC.log`, `wranglerD.log`, `wranglerE.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Refuted. Koa 3.2.1 + @koa/router behind `httpServerHandler` on workerd emits full db spans (mysql2 AND mysql@2) with @sentry/cloudflare 10.67.0 from develop, built with `vite build` + `sentryCloudflareVitePlugin()` at its DEFAULT settings (autoInstrumentation: true, buildTimeInstrumentation: true). The reporter's boot crash was not caused by `buildTimeInstrumentation`; it was caused by building the Koa app at MODULE SCOPE. The one change that makes everything work: construct the Koa app and call `app.listen()` lazily inside the `fetch` handler.

Working entry shape (src/index.js), only the wiring that matters:

  const inner = httpServerHandler({ port: 8080 });
  let listening;
  function ensureApp() {
    if (!listening) { const app = buildApp(); listening = new Promise(r => app.listen(8080, r)); }
    return listening;
  }
  export default Sentry.withSentry(() => ({ dsn, tracesSampleRate: 1.0, traceLifecycle: 'static' }), {
    async fetch(request, env, ctx) { await ensureApp(); return inner.fetch(request, env, ctx); },
  });

mysql2 needs `disableEval: true` in the connection options on workerd (same as the express probe).

SINK, traceLifecycle 'static' (verbatim):
{"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","trace_id":"13a11f5300654fe389c79da01ef9ccd9","sdk":"sentry.javascript.cloudflare","spans":["router /db","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /db1","op":"http.server","source":"route","status":"ok","trace_id":"9e2969799e824450ada8bef71cb8b5a3","sdk":"sentry.javascript.cloudflare","spans":["router /db1","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"2f655f08bb094f13af2186947071b878","sdk":"sentry.javascript.cloudflare","spans":["router /users/:id"]}
(/db = mysql2, /db1 = mysql@2, so BOTH drivers are instrumented. Route names also work, contrary to the sibling "route names" claim: source "route", name "GET /users/:id".)

SINK, default traceLifecycle 'stream' (verbatim, trimmed):
{"type":"span","trace_id":"e04b62572a09467e9d071ca9340636b7","items":["db mysql2.connect","db SELECT users","router /db","http.server GET /db"],"raw":[{"name":"mysql2.connect","status":"ok","is_segment":false,"origin":"auto.db.mysql2.diagnostic_channel"},{"name":"SELECT users","status":"ok","is_segment":false,"origin":"auto.db.mysql2.diagnostic_channel"},{"name":"/db","status":"ok","is_segment":false,"origin":"auto.http.koa"},{"name":"GET /db","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}
{"type":"span","trace_id":"89be143f40e24aaa9e2d65059a3e262e","items":["db SELECT users","router /db1","http.server GET /db1"],"raw":[{"name":"SELECT users","status":"ok","is_segment":false,"origin":"auto.db.mysql"},{"name":"/db1","status":"ok","is_segment":false,"origin":"auto.http.koa"},{"name":"GET /db1","status":"ok","is_segment":true,"origin":"auto.http.cloudflare"}]}

ROOT CAUSE of the reported crash (reproduced, with the exact frame the reporter did not have). I rebuilt the reporter's module-scope shape (src2/index.js + vite.config.top.mjs + wrangler.top.jsonc) and got the identical failure:

  service core:user:v4_koa_cf_top: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
      at null.<anonymous> (index.js:54317:34) in use
      at null.<anonymous> (index.js:67832:5)

index.js:67832 is `app.use(router.routes()).use(router.allowedMethods());` and index.js:54317 is inside the injected Koa wrapper, in the `use` frame:

  if (!tr_ch_apm_hasSubscribers(tr_ch_apm$use)) return __apm$traced();
  return tr_ch_apm$use.start.runStores(__apm$ctx, () => { ... })   // <- line 54317

So `buildTimeInstrumentation` injects an `orchestrion:koa` channel around `Koa.prototype.use`, the Sentry subscriber starts a span there, span-id generation calls a random source, and workerd forbids random values at global scope. It never even reaches `app.listen`. This is why the reporter's mysql-free variant failed identically (it still had `app.use` at module scope) and why the crash disappeared with `buildTimeInstrumentation: false` (no channel, no subscriber, no span). Nothing about mysql or `ssr.noExternal` is involved. It is a real sharp edge: the instrumented `app.use` is what crashes, and the workerd error text points at Cloudflare's handler docs, not at Sentry, so it is very hard to attribute.

Not tested: `vite dev` (the sibling express probe found @cloudflare/vite-plugin's own dev runner crashes with `superCtor.prototype ... Received undefined`, unrelated to Sentry) and esbuild + orchestrion (express probe: worker will not boot, `Dynamic require of "tty"`).

## Workaround

Build the Koa app and call `app.listen()` inside the `fetch` handler instead of at module scope, and keep `sentryCloudflareVitePlugin()` at its defaults. Concretely: hoist `const inner = httpServerHandler({ port: 8080 })` to module scope (that is safe), but put `new Koa()`, every `app.use(...)`, the router wiring and `app.listen(8080)` behind a memoized `ensureApp()` that the handler awaits before delegating to `inner.fetch`. With mysql2, also pass `disableEval: true` to `createConnection`.

## Docs impact

On Cloudflare Workers, do not create the Koa app or call `app.use()` / `app.listen()` at module scope: with the Sentry Cloudflare Vite plugin's build-time instrumentation the instrumented `app.use()` starts a span at worker startup and workerd rejects it with "Disallowed operation called within global scope"; build the app and call `listen()` inside the `fetch` handler (memoized), then delegate to the `httpServerHandler` object, and database spans (mysql, mysql2) plus parameterized route names work on both `stream` and `static` trace lifecycles.
