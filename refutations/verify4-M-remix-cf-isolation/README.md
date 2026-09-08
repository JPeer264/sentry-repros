# verify4-M-remix-cf-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-remix-cf` (see `$REPRO/cells/M-remix-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.txt`, `app/`, `build2.log`, `drive.mjs`, `install2.log`, `package-lock.json`, `package.json`, `rec.pid`, `recorder.log`, `recorder.mjs`, `server-B-baseline.ts`, `server-B-baseline.ts.bak2`, `server-C-withsentry.ts`, `server-C-withsentry.ts.bak2`, `server-D-fix.ts`, `server-D-fix.ts.bak2`, `server-E-stream.ts`, `server.ts`, `server.ts.bak2`, `sink.log`, `sink.pid`, `vite.config.ts`, `wr-B2.log`, `wr-B3.log`, `wr-C2.log`, `wr-C3.log`, `wr-D.log`, `wr-E.log`, `wr.pid`, `wrB.pid`, `wrC.pid`, `wrC3.pid`, `wrD.pid`, `wrE.pid`, `wrangler-B-baseline.jsonc`, `wrangler-B-baseline.jsonc.bak`, `wrangler-B.log`, `wrangler-C-withsentry.jsonc`, `wrangler-C-withsentry.jsonc.bak`, `wrangler-C.log`, `wrangler-Cstream.log`, `wrangler-D-fix.jsonc`, `wrangler-D-fix.jsonc.bak`, `wrangler-E-stream.jsonc`, `wrangler.jsonc`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Reproduced the reported break, then made isolation work with a documented entry shape. Probe dir: $SCRATCH/deep/verify4-M-remix-cf-isolation (RERUN.txt has the commands). Remix 2.17.5 + Remix Vite plugin, wrangler 4.129.0 dev / workerd, compatibility_date 2026-05-01, nodejs_compat, develop SDK 10.67.0 tarballs. Probe: GET /tag/alpha|bravo|charlie fired concurrently, each loader does setTag('probe_tag', t), sleeps 400ms, then captureMessage; then GET /sentinel as an unrelated later request.

(B) BROKEN, as reported — server-B-baseline.ts = wrapRequestHandler from @sentry/cloudflare/request, traceLifecycle static, no ALS strategy:
{"type":"event","message":"probe-msg-alpha","tags":{"probe_tag":"bravo"},"trace":"0127aa8054f3439385f235584953a4f5"}
{"type":"event","message":"probe-msg-charlie","tags":{"probe_tag":"bravo"},"trace":"699d433f5d344165a7049b88d9703660"}
{"type":"event","message":"probe-msg-bravo","tags":{"probe_tag":"bravo"},"trace":"18c4734abda74080b27f2ca6998e885c"}
{"type":"event","message":"sentinel","tags":{"probe_tag":"bravo"},"trace":"3195c696b56c48f2b36485f11f761f7b"}
{"type":"transaction","name":"GET /tag/:t","tags":{"probe_tag":"bravo"},...}   (all three)
Extra detail the earlier report did not name: in this shape NO event carries request data at all — every event and transaction has `request.url` absent, even though wrapRequestHandlerWithInit calls addRequest(isolationScope, request). Events also land in a trace that is not their own request's transaction trace (probe-msg-alpha in 0127aa..., which is the /tag/charlie transaction's trace).

(C) WORKS — server-C-withsentry.ts = Sentry.withSentry() from the @sentry/cloudflare MAIN entry wrapping the Remix fetch handler, everything else identical (instrumentBuild + sentryHandleError kept), traceLifecycle static:
{"type":"event","message":"probe-msg-alpha","tags":{"probe_tag":"alpha"},"url":"http://127.0.0.1:47217/tag/alpha","trace":"3197c866dce547c8b8ac38a7efbc4451"}
{"type":"event","message":"probe-msg-bravo","tags":{"probe_tag":"bravo"},"url":"http://127.0.0.1:47217/tag/bravo","trace":"b4ab25eb24cc49bd8221a9aafdc482f0"}
{"type":"event","message":"probe-msg-charlie","tags":{"probe_tag":"charlie"},"url":"http://127.0.0.1:47217/tag/charlie","trace":"02bff4e2fa11456a8a11f7c50b2aacc1"}
{"type":"event","message":"sentinel","url":"http://127.0.0.1:47217/sentinel","trace":"aeb8fadb82c241dda0e6f5beb4e956e3"}   <- no probe_tag at all
Each transaction pairs with its own event's trace and URL. Request data is present again.

(E) WORKS on the other trace lifecycle too — same withSentry entry with the develop default (stream), server-E-stream.ts:
{"type":"event","message":"probe-msg-alpha","tags":{"probe_tag":"alpha"},"url":".../tag/alpha","trace":"251b12f4154548b799d383513a59a3c7"}
{"type":"span","items":[{"name":"routes/tag.$t","trace":"251b12f4154548b799d383513a59a3c7"},{"name":"GET /tag/:t","trace":"251b12f4154548b799d383513a59a3c7","attrs":{"url.full":".../tag/alpha"}}]}
...charlie/bravo likewise on their own trace ids; sentinel event carries no tag.

(D) WORKS — the reported fix, wrapRequestHandler + SentryCF.setAsyncLocalStorageAsyncContextStrategy() at module scope: each event carries only its own tag, own URL, own trace id.

No regression from switching to withSentry: GET /boom/7 still yields {"type":"event","exception":"remix-cf loader error 7","url":".../boom/7","trace":"843aadefd24249eba377b9f8421b451b"} plus {"type":"transaction","name":"GET /boom/:id","source":"route","status":"internal_error","spans":["function routes/boom.$id"]} on the same trace (entry.server.tsx keeps `export const handleError = sentryHandleError`).

Root cause confirmed in source, and it is narrower than "the SDK is broken": packages/cloudflare/src/request.ts routes through wrapRequestHandlerWithInit -> withInvocationIsolationScope (packages/cloudflare/src/utils/invocationScope.ts), and that file's own JSDoc says the stack fallback "does not fork ... there the fork degrades to a no-op". The /request entry deliberately omits setAsyncLocalStorageAsyncContextStrategy because it is the entry for runtimes that CANNOT enable nodejs_compat (its JSDoc names Shopify Oxygen), and the strategy needs node:async_hooks. So on plain Workers with nodejs_compat the fix is to use the documented Workers entry (withSentry), not /request. The repo's own e2e app dev-packages/e2e-tests/test-applications/remix-hydrogen/server.ts uses the wrapRequestHandler shape without the strategy call, so a Hydrogen/Oxygen app is still exposed; @sentry/remix/cloudflare does not re-export setAsyncLocalStorageAsyncContextStrategy (build/esm/cloudflare/index.js), so an Oxygen user must import the @sentry/cloudflare main entry to get it.

## Workaround

On Cloudflare Workers (nodejs_compat available), do not use wrapRequestHandler from @sentry/cloudflare/request for a Remix worker entry. Use the main entry instead:

import { createRequestHandler } from '@remix-run/cloudflare';
import * as Sentry from '@sentry/cloudflare';
import { instrumentBuild } from '@sentry/remix/cloudflare';
import * as remixBuild from './build/server/index.js';

const handleRequest = createRequestHandler(instrumentBuild(remixBuild), 'production');

export default Sentry.withSentry(
  () => ({ dsn: '...', tracesSampleRate: 1.0 }),
  { async fetch(request, env, ctx) { return handleRequest(request, { env, ctx }); } },
);

Keep `export const handleError = sentryHandleError` in app/entry.server.tsx. Works on both traceLifecycle 'static' and the default 'stream'.

If you must keep wrapRequestHandler (Hydrogen on Oxygen, or any shape already built on @sentry/cloudflare/request) and the runtime does have AsyncLocalStorage, add at module scope of the worker entry:
import * as SentryCF from '@sentry/cloudflare';
SentryCF.setAsyncLocalStorageAsyncContextStrategy();
That also fixes it, at the cost of importing the main entry.

## Docs impact

On /platforms/javascript/guides/cloudflare/frameworks/remix/, the worker-entry step must show `Sentry.withSentry()` from `@sentry/cloudflare` wrapping the Remix `createRequestHandler` (with `instrumentBuild` and `export const handleError = sentryHandleError`), and the Hydrogen pages that show `wrapRequestHandler` from `@sentry/cloudflare/request` need a warning: `wrapRequestHandler` does not install the AsyncLocalStorage async-context strategy, so per-request isolation is off — tags, user and request data set during one request appear on every other event served by the same isolate; on a runtime where `nodejs_compat` is available, call `Sentry.setAsyncLocalStorageAsyncContextStrategy()` from `@sentry/cloudflare` once at module scope of the worker entry, or use `withSentry` instead.
