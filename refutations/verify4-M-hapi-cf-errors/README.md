# verify4-M-hapi-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-hapi-cf` (see `$REPRO/cells/M-hapi-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `build1.log`, `build2.log`, `devA.log`, `devA.pid`, `devB.log`, `devB.pid`, `devC.log`, `devC.pid`, `devD.log`, `devD.pid`, `devE.log`, `devE.pid`, `flagprobe.jsonc`, `install.log`, `node-control.mjs`, `package-lock.json`, `package.json`, `run-b/`, `run-c/`, `sink.log`, `sink.mjs`, `sink.pid`, `sink2.log`, `src/`, `vite.config.mjs`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

CONFIRMED as reported for every documented wiring, but the root cause is now pinned and it is NOT in Sentry: it is a workerd `node:http` server-shim bug, and neutralising it makes the SDK's own `hapiIntegration()` capture the throw correctly.

Probe dir: $SCRATCH/deep/verify4-M-hapi-cf-errors/ (src/index.mjs, wrangler.jsonc, vite.config.mjs, node-control.mjs, devA.log = plain wrangler/esbuild, devE.log = vite + sentryCloudflareVitePlugin, sink.mjs on port 52413). node_modules removed after the run.

WHAT I VARIED (all still broken out of the box): plain wrangler/esbuild build; vite + `sentryCloudflareVitePlugin({autoInstrumentation:false})`; `traceLifecycle: 'static'` and `'stream'`; module-scope vs. deferred route registration; `hapiIntegration()` present and installed. Only the two app-side workarounds below produce an event.

ROOT CAUSE. Instrumenting `request.raw.res` on workerd (compat flags `nodejs_compat`, `enable_nodejs_http_server_modules`, compat date 2026-05-01, workerd 1.20260903.1) shows the response emits `close` BEFORE `finish` and before `res.end()` is ever called:
  MARK onPreResponse /error/7 isBoom=true writableEnded=false
  MARK res 'close' +2ms writableEnded=false writableFinished=false endCalled=false
  MARK res.end() called +3ms writableEnded(native)=false
  MARK res 'finish' +3ms writableEnded=true
  MARK response-event /error/7 writableEnded=true writableFinished=true finalStatus=499 isBoom=true hasClose=undefined
Plain Node control (node-control.mjs, same hapi 21, same routes) emits only `finish`-first and gets it right:
  internal:handler,error
  ERROR-CHANNEL:boom-7:tags=internal,error
  response-event writableEnded=true finalResponseStatus=500

hapi's transmit registers `res.on('close', internals.end(env,'close'))` (node_modules/@hapi/hapi/lib/transmit.js:259). Because `res.writableEnded` is still false when that premature `close` fires, `internals.end` takes the client-disconnect branch and does `request._setResponse(new Boom('Request close', {statusCode: disconnectStatusCode /*499*/}))` (transmit.js:287-305). `Request._finalize()` (lib/request.js:506-521) then only emits the `request`/`error` podium event when `this.response._close && this.response.statusCode === 500 && this.response._error` — but `this.response` is now a bare 499 Boom (`finalStatus=499 hasClose=undefined`), so the `error` channel never fires. That is why `hapiIntegration()`'s listener, and any hand-rolled `{name:'request',channels:['error']}` listener, never runs on Workers. The HTTP status the client sees is still 500 (headers were already written), so the breakage is invisible.

FIX THAT WORKS (one ext, no Sentry change), on the vite build with `hapiIntegration()`:
  server.ext('onRequest', (request, h) => {
    const res = request.raw.res;
    const on = res.on.bind(res);
    res.on = (event, listener) => (event === 'close' ? res : on(event, listener));  // drop workerd's premature 'close'
    return h.continue;
  });
Sink, same request driven with and without it:
  transaction | GET /error/{id} | trace= 7693a9e1b1544188a72be3db1775ab65        <- no fix: transaction only, no event
  event | Error: hapi-cf-route-boom-43 | mech= auto.function.hapi | tx= GET /error/{id} | trace= 50aae58175cd4f72bd4b6f0c609233b5
  transaction | GET /error/{id} | trace= 50aae58175cd4f72bd4b6f0c609233b5
Stable over 3 consecutive requests (3/3 captured), `/ok` and `/sentinel` unaffected (200, status=ok), and identical under `traceLifecycle: 'stream'` (`event Error: hapi-cf-route-boom-32 | mech= auto.function.hapi` with the fix, nothing without). `Object.defineProperty(res,'writableEnded',{get:()=>true})` works equally well and is the more direct statement of the workerd defect.

BUILD CAVEAT: `hapiIntegration()` only ever attaches its listener when the orchestrion channels are injected. devE.log (vite + plugin): "Integration installed: Hapi" and "MARK BOOT handlerState=true". devA.log (plain wrangler/esbuild): "Integration installed: Hapi" but "MARK BOOT handlerState=false" — so on a plain wrangler build the res-`close` fix alone is not enough; you need the Vite plugin as well, or the onPreResponse workaround.

The prior agent's `onPreResponse` + `Sentry.captureException` also works and needs no monkey-patching, but produces a strictly worse event: `event | Error: hapi-cf-route-boom-42 | mech= hapi.onPreResponse | tx= None` — no transaction name (the SDK's own handler sets it from `request.route`), and the mechanism is hand-written.

Not a Sentry bug, and no compat flag fixes it: the workerd binary only offers `enable/disable_nodejs_http_server_modules`, `enable/disable_nodejs_http_modules`, `nodejs_compat_v2` — none change the close/finish ordering. This should be filed against workerd's `node:http` `ServerResponse` (emit `finish` before `close`, and have `writableEnded` true when `close` fires). It also silently corrupts hapi generally on Workers: every request, success or failure, ends with `request.response` rewritten to a 499 disconnect Boom, so `server.events.on('response')`, `onPostResponse` and `request.info.responded` all see a bogus disconnect.

## Workaround

Two, both app-side. Preferred (keeps the SDK's own capture, correct transaction name and `auto.function.hapi` mechanism, requires the Vite plugin so the hapi channels are injected): drop workerd's premature `close` event before hapi's transmit can see it — `server.ext('onRequest', (request, h) => { const res = request.raw.res; const on = res.on.bind(res); res.on = (e, l) => (e === 'close' ? res : on(e, l)); return h.continue; })`. Equivalent: `Object.defineProperty(request.raw.res, 'writableEnded', { configurable: true, get: () => true })` in the same ext. Fallback that works on a plain wrangler/esbuild build with no Sentry bundler plugin: `server.ext('onPreResponse', (request, h) => { const r = request.response; if (r?.isBoom) Sentry.captureException(r, { mechanism: { type: 'hapi.onPreResponse', handled: false } }); return h.continue; })` — right trace and request data, but no transaction name on the event.

## Docs impact

On Cloudflare Workers, hapi's `request`/`error` event never fires because workerd's `node:http` `ServerResponse` emits `close` before `finish` (with `writableEnded` still false), which hapi reads as a client disconnect and turns every response into a 499 — so `Sentry.hapiIntegration()` captures nothing; until workerd is fixed, add `server.ext('onRequest', (request, h) => { const res = request.raw.res; const on = res.on.bind(res); res.on = (e, l) => (e === 'close' ? res : on(e, l)); return h.continue; })` (with the Sentry Cloudflare Vite plugin enabled so the hapi instrumentation channels are injected), or capture manually from `server.ext('onPreResponse')` when `request.response.isBoom`.
