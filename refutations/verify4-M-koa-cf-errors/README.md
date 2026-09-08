# verify4-M-koa-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-koa-cf` (see `$REPRO/cells/M-koa-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `dcprobe/`, `package-lock.json`, `package.json`, `plain/`, `sink.log`, `sink.pid`, `src/`, `vb-e.log`, `vb-f.log`, `vite.c.config.mjs`, `vite.config.mjs`, `vite.d.config.mjs`, `vite.e.config.mjs`, `vite.f.config.mjs`, `vite.lazy.config.mjs`, `vitebuild-c.log`, `vitebuild-d.log`, `vitebuild1.log`, `vitebuild2.log`, `vitebuild3.log`, `vitebuild4.log`, `vitebuild5.log`, `vitebuild6.log`, `w-c.log`, `w-d-static.log`, `w-d.log`, `w-e.log`, `w-f.log`, `w-plain.log`, `w1.log`, `w1.pid`, `w2.log`, `w2.pid`, `w3.log`, `w3.pid`, `w3b.log`, `w3b.pid`, `w3c.log`, `w3c.pid`, `w4.log`, `w4.pid`, `w5.log`, `w5.pid`, `w6.log`, `w6.pid`, `wrangler-a.log`, `wrangler.c.jsonc`, `wrangler.d.jsonc`, `wrangler.e.jsonc`, `wrangler.f.jsonc`, `wrangler.jsonc`, `wrangler.lazy.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Koa errors ARE captured automatically on Cloudflare with the develop SDK — no `app.on('error')` needed. The reporter's setup was missing the one thing that turns Koa instrumentation on in a Worker: the `@sentry/cloudflare/vite` plugin's build-time instrumentation. A plain `wrangler dev` on a hand-written `src/index.js` (esbuild, no Vite) can never instrument Koa, because on Cloudflare the koa integration is not in the default set at all — `getBaseDefaultIntegrations()` in packages/cloudflare/src/baseSdk.ts only adds `...getRegisteredChannelIntegrations()`, i.e. whatever the Vite plugin registered on `globalThis.__SENTRY_ORCHESTRION__.integrations` at build time. `koaIntegration` is wired for that path (packages/server-utils/src/orchestrion/config/channel-integration-definitions.ts:48 `{ exportName: 'koaIntegration', modules: ['koa'] }`, config in packages/server-utils/src/orchestrion/config/koa.ts), and the integration auto-attaches the error listener on koa's `callback` channel (packages/server-utils/src/integrations/koa/koa-error-handler.ts, `attachKoaErrorHandler`) with `mechanism: { type: 'auto.middleware.koa', handled: false }`, captured inside the stashed request span.

WHAT I MEASURED

Baseline (their shape: plain wrangler dev, no Vite plugin, no `app.on('error')`) — reproduces their finding exactly. `/integrations` probe route:
  {"integrations":["Dedupe","EventFilters","FunctionToString","ConversationId","LinkedErrors","Fetch","HttpServer","RequestData","Console","SpanStreaming"],"orchestrionIntegrations":[],"koaHandlerAttached":false,"errorListeners":1}
GET /boom/7 -> 500, sink after sentinel:
  {"type":"span","trace_id":"c76624a98dc1450893a12694f765009f","items":["http.server GET"],"raw":[{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.cloudflare"}]}
  (no event, no router span — matches the report)

Fix (Vite build with a bare `sentryCloudflareVitePlugin()`, Koa app constructed inside the first `fetch`, still NO `app.on('error')`), stream lifecycle:
  {"integrations":[...,"Console","Koa","SpanStreaming"],"orchestrionIntegrations":["koa"],"koaHandlerAttached":true,"errorListeners":2}
  {"type":"event","exception":"Error: koa-cf boom","mechanism":"auto.middleware.koa","handled":false,"sdk":"sentry.javascript.cloudflare","runtime":"cloudflare","hasContextLine":false,"transaction":"GET /boom/:id","trace_id":"affae71abd4644fbac876e5514b8dce3","user":{"ip_address":"127.0.0.1"},"request":{"url":"http://127.0.0.1:44741/boom/7","method":"GET",...}}
  {"type":"span","trace_id":"affae71abd4644fbac876e5514b8dce3","items":["router /boom/:id","http.server GET /boom/:id"],"raw":[{"name":"/boom/:id","status":"error","parent_span_id":"8d121e57b9269ec5","is_segment":false,"origin":"auto.http.koa"},{"name":"GET /boom/:id","status":"error","is_segment":true,"origin":"auto.http.cloudflare"}]}
Same worker with `traceLifecycle: 'static'`:
  {"type":"event","exception":"Error: koa-cf boom","mechanism":"auto.middleware.koa","handled":false,...,"transaction":"GET /boom/:id","trace_id":"8467ce5819094f3bb99ba8d504647c47",...}
  {"type":"transaction","name":"GET /boom/:id","op":"http.server","source":"route","status":"internal_error","trace_id":"8467ce5819094f3bb99ba8d504647c47","spans":["router /boom/:id"]}

So three of the reporter's sub-claims fall at once: the error arrives with no user code; the mechanism is `auto.middleware.koa` (not "whatever the user writes"); and the server span/transaction is route-named (`GET /boom/:id`, `source: "route"`), not method-only. `hasContextLine: false` still holds (no `context_line` frames in either shape). Event and span share the trace id in both lifecycles.

WHY THEIR VITE ATTEMPT LOOKED LIKE "DOES NOT BOOT" — and the one real constraint

With the plugin on and the Koa app built at module scope (`const app = new Koa(); app.use(router.routes()); app.listen(8080)` at top level), workerd refuses to start:
  service core:user:koa-cf-c: Uncaught Error: Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or connect()), setting a timeout, and generating random values are not allowed within global scope.
      at index.js:54314:34 in use
      at index.js:57063:5
Line 54314 is inside the instrumented `Application.prototype.use`: `tr_ch_apm$use.start.runStores(__apm$ctx, ...)`. So it is the injected `diagnostics_channel` `runStores` call in `app.use()` — reached because `hasSubscribers` is truthy on workerd's shim — that performs the disallowed global-scope operation, not `app.listen()`. I bisected this:
  - Vite + `cloudflare()` only, module-scope app: boots, `GET /users/42 -> {"id":"42"}`.
  - Vite + `sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })`, module-scope app: boots, `{"id":"42"}`.
  - Vite + bare `sentryCloudflareVitePlugin()`, module-scope app: the error above.
  - Vite + bare `sentryCloudflareVitePlugin()`, app built inside `fetch`: boots and gives everything quoted above.
That constraint is real and undocumented, but it is a boot-shape bug in the injected `use` wrapper, not the absence of an error-capture mechanism.

FILES / RERUN (all under $SCRATCH/deep/verify4-M-koa-cf-errors/, node_modules removed after the run):
  npm install --no-audit --no-fund koa@3 @koa/router wrangler@4 vite@6 @cloudflare/vite-plugin $S/pack/sentry-cloudflare-10.67.0.tgz $S/pack/sentry-core-10.67.0.tgz $S/pack/sentry-server-utils-10.67.0.tgz $S/pack/sentry-server-runtime-injection-10.67.0.tgz $S/pack/sentry-opentelemetry-10.67.0.tgz
  PORT=44711 node $S/qs/sink.mjs > sink.log 2>&1 &
  Baseline: src/index.js + wrangler.jsonc, `./node_modules/.bin/wrangler dev --port 44721 --inspector-port 0` (log w-plain.log)
  Fix:      src/lazyd.js + wrangler.d.jsonc + vite.d.config.mjs, `./node_modules/.bin/vite build -c vite.d.config.mjs` then `./node_modules/.bin/wrangler dev --config dist-d/koa_cf_d/wrangler.json --port 44741 --inspector-port 0` (logs w-d.log, w-d-static.log; static adds `--var TRACE_LIFECYCLE:static`)
  Bisect:   src/eager.js/wrangler.c.jsonc/vite.c.config.mjs (fails), src/eagerbare.js/vite.e.config.mjs (no Sentry plugin, boots), vite.f.config.mjs (buildTimeInstrumentation:false, boots) — logs w-c.log, w-e.log, w-f.log
GOTCHA when rerunning: a stale `.wrangler/deploy/config.json` from an earlier run silently redirects `wrangler dev` to an old `dist-*` build (it did to me, and produced a phantom "it already works" result); always pass `--config <the config you mean>` or overwrite that file.

The repo's own reference app (~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/node-koa/index.js) confirms the intended shape: it never calls `setupKoaErrorHandler` and never registers `app.on('error')`, yet `tests/errors.test.ts` expects `/test-exception` to produce an event — the listener is auto-attached by the koa integration on both Node and, as shown here, Cloudflare.

## Workaround

Two, depending on how much you want to change.

1. Full automatic capture (preferred, refutes the finding): build the Worker with Vite and add the Sentry plugin, then construct the Koa app lazily inside the first request instead of at module scope.

vite.config.mjs:
```js
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite';
export default { plugins: [cloudflare(), sentryCloudflareVitePlugin()] };
```
src/index.js:
```js
import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';

let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  const app = new Koa();
  const router = new Router();
  router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });
  app.use(router.routes()).use(router.allowedMethods());
  app.listen(8080);                 // must run inside a handler, not at module scope
}
const inner = httpServerHandler({ port: 8080 });   // this one is fine at module scope

export default Sentry.withSentry(
  env => ({ dsn: '...', tracesSampleRate: 1.0 }),
  { fetch(request, env, ctx) { boot(); return inner.fetch(request, env, ctx); } },
);
```
`vite build`, then `wrangler dev --config dist/<worker>/wrangler.json`. Errors thrown in middleware/routes now arrive with `mechanism.type: 'auto.middleware.koa'`, `handled: false`, correct trace id and request data, and the transaction/server span is route-named. No `app.on('error')`.

2. If you cannot use Vite (hand-written entry + plain `wrangler dev`), the reporter's `app.on('error', err => Sentry.captureException(err, { mechanism: { type: 'koa.onerror', handled: false } }))` remains the only option — and there you also lose the `router` spans and the route-named transaction.

Do NOT do 1 with a module-scope `new Koa()` / `app.use()`: the injected `use` wrapper calls `diagnostics_channel` `runStores` there and workerd rejects it with "Disallowed operation called within global scope … at index.js:… in use", so the Worker never starts. `sentryCloudflareVitePlugin({ buildTimeInstrumentation: false })` avoids the crash but also removes the Koa instrumentation, so it is not a fix.

## Docs impact

On Cloudflare Workers, Koa (and any other `node:http` framework behind `cloudflare:node`'s `httpServerHandler`) is only instrumented when the Worker is built with Vite and `sentryCloudflareVitePlugin()` — with that plugin the SDK auto-registers Koa's `app.on('error')` listener for you (errors arrive with `mechanism.type: "auto.middleware.koa"`, `handled: false`) and names the transaction after the matched route, while a hand-written entry bundled by `wrangler dev` alone gets no Koa integration at all and needs a manual `app.on('error', err => Sentry.captureException(err))`; because the plugin's build-time instrumentation cannot run inside a Worker's global scope, the Koa app must be created and `listen()`ed inside the `fetch` handler rather than at module top level, or the Worker fails to start with "Disallowed operation called within global scope".
