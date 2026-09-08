# verify4-M-fresh-bun-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-fresh-bun` (see `$REPRO/cells/M-fresh-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-baseline-static.log`, `app-r1-baseline-static.log`, `app-r2-baseline-stream.log`, `app-r3-console-static.log`, `app-r4-onerror-static.log`, `app-r5-middleware-static.log`, `app-r6-errorroute-static.log`, `app-r8-console-with-errorroute.log`, `app.pid`, `build.log`, `build2.log`, `entry.ts`, `instrument.ts`, `items-r1-baseline-static.json`, `items-r2-baseline-stream.json`, `items-r3-console-static.json`, `items-r4-onerror-static.json`, `items-r5-middleware-static.json`, `items-r6-errorroute-static.json`, `items-r8-console-with-errorroute.json`, `package-lock.json`, `package.json`, `run.sh`, `sink.log`, `sink.pid`, `sink2.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

Could not refute. Reproduced the reported behaviour exactly and found the structural cause, plus three working wirings (one more than reported) and one init-only fallback that is too fragile to recommend.

Root cause (not a Bun SDK bug, a Fresh design fact): the SSR bundle's `App.handler()` ends with a catch-all that never rethrows:
  app/_fresh/server/server-entry.js:6394  } catch (err) { ctx.error = err; return await DEFAULT_ERROR_HANDLER(ctx); }
  app/_fresh/server/server-entry.js:6104  DEFAULT_ERROR_HANDLER = async (ctx) => { ... console.error(error); return new Response("Internal server error", { status: 500 }); }
`@sentry/bun`'s Bun.serve instrumentation only captures what escapes the fetch handler (packages/bun/src/integrations/bunserver.ts:274-282 `catch (e) { captureException(e, { mechanism: { type: 'auto.http.bun.serve', handled: false } }) }`), so nothing is captured; the span still gets `internal_error` from the 500 status. Fresh also has an internal `#onError` listener slot (compileMiddlewares(..., onError), server-entry.js:5441) but `App` hard-codes it to NOOP and never exposes a setter, so there is no SDK-side hook to attach to. Fresh is fully bundled into `_fresh/server/server-entry.js`, so no import hook (`@sentry/server-runtime-injection`, which has no Fresh support anyway) can ever see it; bundling with `Bun.build` + `sentryBunPlugin` cannot change this.

Runs (sink 51873, app 51874, one bun process per run, sentinel-gated):
R1 baseline, traceLifecycle static -> /boom and /boomasync return 500, no event envelope:
  {"type":"transaction","name":"GET /boom","op":"http.server","source":"url","status":"internal_error","trace_id":"6d79854c03884617956129af36dd7c81","sdk":"sentry.javascript.bun","spans":[]}
  {"type":"transaction","name":"GET /boomasync","op":"http.server","source":"url","status":"internal_error","trace_id":"c4f93db8c4894e7eabfd273536ee04de","sdk":"sentry.javascript.bun","spans":[]}
  next envelope is the sentinel: {"type":"event","message":"sentinel",...,"trace_id":"ed4fc95ec8694e2d9ff1a766defd38a0"}
R2 baseline, traceLifecycle stream -> identical, still no event (only the sentinel arrives). The lifecycle is irrelevant to this.
R4 `app.onError("*", ctx => Sentry.captureException(ctx.error, ...))` (NEW, not in the report) -> works, and unlike the middleware it needs no try/catch/rethrow:
  {"type":"event","exception":"Error: fresh-bun-route-boom","mechanism":"fresh.onError","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"trace_id":"73e498fee222408e94f17ef32aee4a1f","request":{"url":"http://127.0.0.1:51874/boom","method":"GET",...}}
R6 `routes/_error.tsx` handler calling `Sentry.captureException(ctx.error)` (NEW; the file-system form, matches what the Fresh/CF and Fresh/Deno probes used) -> works:
  {"type":"event","exception":"Error: fresh-bun-route-boom","mechanism":"fresh._error","handled":false,"sdk":"sentry.javascript.bun","runtime":"bun","hasContextLine":true,"trace_id":"d5c401a999a443fdaa7b25da8f22e9b0","request":{...}}
R5 the reported middleware -> reproduced verbatim: mechanism "fresh.middleware", handled false, request data, context lines, same trace_id as the transaction.
R3 init-only variant, `integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })]` and NO app code at all -> the error IS captured, correctly linked to the transaction trace, but as handled:true with a console mechanism:
  {"type":"event","exception":"Error: fresh-bun-route-boom","mechanism":"auto.core.capture_console","handled":true,...,"trace_id":"5b6945bf31124192a2872d7e2afc46bd"}
R8 the same init-only variant AFTER adding a `routes/_error.tsx` -> nothing is captured at all (transactions only, then the sentinel), because a custom error route replaces `DEFAULT_ERROR_HANDLER` and its `console.error`. So the console trick silently stops working the moment the app gets an error page; do not document it as the fix.

All four route-error events carry request URL/method/headers and context lines, and share the trace_id of their `http.server` transaction, so once captured the data is complete. Fresh's own OpenTelemetry spans ("middlewares", route spans, plus its `span.updateName(\`${method} ${pattern}\`)` at server-entry.js:6371) never reach Sentry either: every transaction came back with `spans:[]`.

Files: $SCRATCH/deep/verify4-M-fresh-bun-errors/{instrument.ts,entry.ts,run.sh,app/main.ts,app/routes/boom.tsx,app/routes/boomasync.tsx,app/routes/_error.tsx,items-r*.json,app-r*.log}. `app/main.ts` compiles all wirings in and selects with `globalThis.__WIRING`, set from the `WIRING` env var in `entry.ts`. Rerun: `PORT=51873 node $S/qs/sink.mjs &` then `bash run.sh <baseline|middleware|onerror|errorroute> <static|stream> <0|1 captureConsole> <tag>`. Rebuild after touching app/: `cd app && deno task build` (works offline, ~2s).

## Workaround

Capture from a Fresh error hook; all three work identically on bun, pick one. Cleanest is the file-system error route, `app/routes/_error.tsx`:

  import * as Sentry from "@sentry/bun";
  import { define } from "../utils.ts";
  export const handler = define.handlers({
    GET(ctx) {
      Sentry.captureException(ctx.error, { mechanism: { type: "fresh._error", handled: false } });
      return new Response("Internal server error", { status: 500 });
    },
  });

Programmatic equivalent in `main.ts`: `app.onError("*", ctx => { Sentry.captureException(ctx.error, { mechanism: { type: "fresh.onError", handled: false } }); return new Response("Internal server error", { status: 500 }); })`. The middleware form from the report (`try { return await ctx.next() } catch (err) { Sentry.captureException(err, ...); throw err }`) also works but must be registered before every other `app.use`, or errors thrown by earlier middleware escape it. Do NOT rely on `captureConsoleIntegration`: it happens to catch these errors only while Fresh's built-in error page is in use, and stops capturing entirely as soon as the app defines `_error.tsx` or `onError`.

## Docs impact

Fresh (2.x) catches every error thrown in a route handler or middleware inside its own `App.handler()` and renders its 500 page, so the error never reaches `Bun.serve` and Sentry cannot capture it automatically: add `Sentry.captureException(ctx.error, { mechanism: { type: "fresh._error", handled: false } })` to `routes/_error.tsx` (or to `app.onError("*", ...)`) to report unhandled route errors, and note that the request span is still reported with status `internal_error` either way. There is no Fresh guide under docs/platforms/javascript/guides/ today and neither the Bun nor the Deno guide mentions Fresh, so this needs a new Fresh section rather than an edit.
