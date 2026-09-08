# verify4-M-solidstart-deno-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-solidstart-deno` (see `$REPRO/cells/M-solidstart-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `FIX-middleware-verified.ts`, `FIX-middleware.ts`, `app/`, `build.log`, `build2.log`, `deno-baseline.log`, `deno-hooks.log`, `deno-mw-stream.log`, `deno1.pid`, `deno2.pid`, `deno3.pid`, `install2.log`, `node-stream.log`, `node1.pid`, `package.json`, `r2-b-baseline.log`, `r2-baseline.log`, `r3-baseline.log`, `r3-mw-stream.log`, `r3-mw.log`, `r3-nitrohook.log`, `r3-sa.log`, `r3.pid`, `r3b.pid`, `r3c.pid`, `r3d.pid`, `r3e.pid`, `run2.sh`, `server/`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`, `src/`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Reproduced and then attacked from four directions. The claim survives: with any documented wiring, @sentry/solidstart 10.67.0 on @solidjs/start 2.0.2 / nitro 3.0.260610-beta emits NO error event for a throw inside an API route handler.

Probe dir: $SCRATCH/deep/verify4-M-solidstart-deno-errors/ (app/, build.log, deno-baseline.log, deno-hooks.log, deno-mw-stream.log, node-stream.log, sink.log, FIX-middleware.ts). Built once with `NODE_ENV=production npx vite build`; all variants toggled at runtime by env so one .output serves every run. node_modules removed afterwards; .output kept and still runnable.

(1) BASELINE, deno 2.9.0, traceLifecycle static, no extra wiring, sink 47821 / app 47822:
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"url","status":"internal_error","trace_id":"934a23e3b4de4e2caf205a746eaf1312","sdk":"sentry.javascript.solidstart","spans":["http.server GET /api/error","middleware GET /api/error","http.server GET /api/error"]}
{"type":"transaction","name":"GET /api/error-async","op":"http.server","source":"url","status":"internal_error",...}
{"type":"event","exception":"Error: solidstart-deno server action error","mechanism":"auto.function.solidstart","handled":false,"transaction":"GET /server-error","trace_id":"63993aeace07440d88bf0c5f76aa33a7",...}
{"type":"event","message":"sentinel","mechanism":"generic","handled":true,...}
So a `'use server'` action wrapped in `withServerActionInstrumentation` IS captured (mechanism auto.function.solidstart, handled false, request data, context lines) - that is the only path the repo's own e2e app covers (tests/errors.server.test.ts). The plain and async API-route throws produce only an internal_error transaction; the sentinel after them proves nothing was dropped by timing.

(2) NOT DENO-SPECIFIC and NOT lifecycle-specific. Same .output under node 26.5.0 with traceLifecycle 'stream' (app 47824):
{"type":"span","trace_id":"584ff173bd864105b591b7187c7603fc","items":["middleware GET /api/error","http.server GET","http.server GET","http.server GET","db mysql2.connect"], raw statuses "error", origins auto.http.nitro.h3 / auto.http.nitro.srvx / auto.http.http_server}
{"type":"event","message":"sentinel",...}
No error event on either runtime, either lifecycle.

(3) NITRO ERROR HOOK DOES NOT HELP. I registered `nitroApp.hooks.hook('error', e => Sentry.captureException(e, {mechanism:{type:'probe.nitro.error.hook'}}))` inside the Nitro startup plugin - the same hook @sentry/nitro's own runtime/plugins/server.ts uses (packages/nitro/src/runtime/hooks/captureErrorHook.ts). It never fired: zero probe.nitro.error.hook events in deno-hooks.log/sink. Root cause is in @solidjs/start/dist/server/handler.js `createBaseHandler`: SolidStart builds its OWN `new H3()` app (`const app = new H3(); app.use(handler); return app;`) and Nitro mounts that. The inner H3 app's default onError turns the throw into a 500 response, so the outer Nitro h3App's `onError -> captureError -> hooks.callHook('error', ...)` (visible at .output/server/index.mjs:236) is never reached. Adding @sentry/nitro as a Nitro module would therefore not fix it either.

(4) WHAT DOES WORK: a raw h3 middleware registered through SolidStart's own `createMiddleware([...])` array form. deno + traceLifecycle 'stream', app 47825:
{"type":"event","exception":"Error: solidstart-deno route error","mechanism":"probe.solidstart.middleware","handled":false,"sdk":"sentry.javascript.solidstart","runtime":"node","hasContextLine":true,"transaction":"GET /api/error","trace_id":"e47d003c29a541d8b1acc15f1f12dd2a","user":{"ip_address":"127.0.0.1"},"request":{"url":"http://127.0.0.1:47825/api/error","method":"GET","hasData":false,...},"environment":"production"}
{"type":"span","trace_id":"e47d003c29a541d8b1acc15f1f12dd2a","items":["middleware GET /api/error","http.server GET",...]}
Same under traceLifecycle 'static' (deno-hooks.log) and for the async handler. The event carries the correct transaction name, the request's trace_id, request data, user ip and context lines - i.e. full fidelity, only the mechanism type is user-supplied.

Verdict is confirmed-broken because nothing the SDK ships or the docs describe produces this event: no init placement (Nitro startup plugin is the only supported one for SolidStart 2), neither trace lifecycle, no bundler/orchestrion variant, and no Sentry-provided hook. The fix has to be hand-written by the user.

Commands to rerun (ports are examples): `PORT=47821 node $REPRO/_toolbox/sink.mjs &`; `cd app && NODE_ENV=production npx vite build`; `SENTRY_TUNNEL=http://127.0.0.1:47821/ SENTRY_LIFECYCLE=static PROBE_MW=1 PORT=47825 HOST=127.0.0.1 deno run -A .output/server/index.mjs`. Drop PROBE_MW for the baseline, add PROBE_NITRO_HOOK=1 for the Nitro-hook variant.

## Workaround

Add a try/catch h3 middleware as the first entry of `createMiddleware`'s array form and point `solidStart({ middleware: './src/middleware.ts' })` at it. Full file at .../deep/verify4-M-solidstart-deno-errors/FIX-middleware.ts:

import * as Sentry from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';

export default createMiddleware([
  async (event, next) => {
    try {
      return await next();
    } catch (error) {
      Sentry.captureException(error, { mechanism: { handled: false, type: 'solidstart.middleware' } });
      throw error;
    }
  },
  ...createMiddleware({ onBeforeResponse: [Sentry.sentryBeforeResponseMiddleware()] }),
]);

The object form (`createMiddleware({ onRequest, onBeforeResponse })`) cannot do this - neither lifecycle wraps the handler - so the array form is required, and the existing `sentryBeforeResponseMiddleware` has to be spread in through a nested object-form call. Rethrowing keeps the 500 response and the internal_error span status unchanged. For `'use server'` actions the shipped `withServerActionInstrumentation` wrapper already captures the throw and needs no middleware.

## Docs impact

The SolidStart guide's tracing verification snippet (~/dev/sentry-docs/docs/platforms/javascript/guides/solidstart/index.mdx:452-460) tells the user to create `export async function GET() { throw new Error("Sentry Example API Route Error"); }` and says clicking the button triggers "an error in the API route" - on SolidStart 2 that error is never sent, so the page needs a correction such as: "On SolidStart 2, errors thrown from an API route handler are caught by SolidStart's internal h3 app and are not captured automatically. To report them, add a try/catch middleware as the first entry of `createMiddleware`'s array form in `src/middleware.ts` that calls `Sentry.captureException(error)` and rethrows; only `'use server'` actions wrapped in `withServerActionInstrumentation` are captured out of the box." The middleware section at index.mdx:196-235 currently documents only `sentryBeforeResponseMiddleware` (trace meta tags) and should carry the same snippet, noting that the object form of `createMiddleware` cannot wrap the handler.
