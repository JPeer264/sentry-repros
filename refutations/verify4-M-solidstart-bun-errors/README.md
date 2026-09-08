# verify4-M-solidstart-bun-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-solidstart-bun` (see `$REPRO/cells/M-solidstart-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-src/`, `app.pid`, `app.pid2`, `app.pid3`, `app.pid4`, `app.pid5`, `app.pid6`, `app.pid7`, `app.pid8`, `build-a.log`, `build-b.log`, `build-c.log`, `build1.log`, `build2.log`, `build3.log`, `install.log`, `run-a-baseline.log`, `run-b-mw.log`, `run-baseline.log`, `run-c-nitroroute.log`, `run-d-mw-stream.log`, `run-e-mw-node.log`, `run-f-onerror.log`, `run-g-mw-page.log`, `run-hook.log`, `run-mw-node.log`, `run-mw-node2.log`, `run-mw-stream.log`, `run-mw.log`, `run-mw2.log`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Reproduced the report exactly, found the root cause in the build output, and made the broken half work with a 6-line user-side middleware. The other half (SSR page render errors) stays swallowed even then.

Setup (same as the report): @solidjs/start 2.0.2 + nitro 3.0.260610-beta + vite 8, develop SDK tarballs, `sentrySolidStart()` in vite.config.ts, `Sentry.init` in `server/plugins/sentry.ts`, `sentryBeforeResponseMiddleware()` in `src/middleware.ts`, `npx vite build` then `bun .output/server/index.mjs`. Sink on 41777, app on 41778, sentinel = `GET /api/sentinel` (captureMessage + flush) after every probe request, so absence is deterministic.

RUN A - baseline, docs wiring, bun, traceLifecycle 'static' ($S/deep/verify4-M-solidstart-bun-errors/run-a-baseline.log). `src/routes/api/boom.ts` = `export function GET(){ throw new Error('probe-api-route-error') }`. Confirmed swallowed:
{"type":"transaction","name":"GET /api/boom","op":"http.server","source":"url","status":"internal_error","spans":["middleware GET /api/boom","http.server GET /api/boom"]}
{"type":"transaction","name":"GET /api/boom-async","op":"http.server","source":"url","status":"internal_error",...}
{"type":"event","exception":"Error: Error thrown from Solid Start E2E test app server route","mechanism":"auto.function.solidstart","handled":false,...}
{"type":"event","message":"sentinel","mechanism":"generic","handled":true,...}
No `event` for either boom route, before the sentinel. Async throws behave identically to sync ones.

ROOT CAUSE (read from `.output/server/`, not guessed). SolidStart 2 builds its SSR renderer as its own Nitro service with its own h3 app: `_ssr/ssr.mjs` ends with `const app = new H3(); app.use(handler); return app;` - constructed with NO config, so `config.onError` is undefined. h3's `prepareResponse` then does `if (error.unhandled && !config.silent) console.error(error)` and, with no `onError`, returns `errorResponse(...)` directly. The 500 Response is handed back to the outer Nitro app as a normal response, so the main app's `onError` in `.output/server/index.mjs` line 350 (`createH3App({ onError(error, event){ captureError(error,{event}); ... } })`) - the thing that calls `hooks.callHook("error", ...)`, i.e. what `@sentry/nitro`'s server plugin hooks - never runs. A previous run of this same probe registered an extra `nitroApp.hooks.hook('error', ...)` by hand and its `[probe] nitro error hook fired` line never printed (`run-hook.log`), which matches.

PROOF the Nitro side is fine and only the SolidStart service swallows - RUN C ($V/run-c-nitroroute.log): added `server/routes/nitro-boom.ts` = `defineHandler(() => { throw new Error('probe-nitro-route-error') })`, no user error handling at all:
{"type":"event","exception":"Error: probe-nitro-route-error","mechanism":"auto.http.nitro.onTraceError","handled":false,"hasContextLine":true}
{"type":"event","exception":"Error: probe-nitro-route-error","mechanism":"chained","handled":true,...}
{"type":"transaction","name":"GET /nitro-boom","op":"http.server","source":"route","status":"internal_error",...}
{"type":"transaction","name":"GET /api/boom","op":"http.server","source":"url","status":"internal_error",...}   <- still no event
(Side observation, not this capability: the Nitro route error is reported twice, once as `auto.http.nitro.onTraceError` handled=false and once as `chained` handled=true.)

RUN B - the fix, bun, 'static' ($V/run-b-mw.log). `src/middleware.ts` wraps `next()` (see workaround). Both the sync and the async API-route throw now arrive:
{"type":"event","exception":"Error: probe-api-route-error","mechanism":"solidstart.middleware","handled":false,"sdk":"sentry.javascript.solidstart","runtime":"node","hasContextLine":true}
{"type":"event","exception":"Error: probe-api-route-error-async","mechanism":"solidstart.middleware","handled":false,...,"hasContextLine":true}
{"type":"event","exception":"Error: Error thrown from Solid Start E2E test app server route","mechanism":"auto.function.solidstart","handled":false,...}
plus the three `internal_error` transactions and the sentinel.

RUN D - same fix, bun, traceLifecycle 'stream' ($V/run-d-mw-stream.log): works, error event plus `{"type":"span",...,"raw":[{"name":"GET /api/boom","origin":"auto.http.nitro.h3"},{"name":"GET","status":"error","is_segment":true,"origin":"auto.http.nitro.srvx"}]}`.

RUN E - same fix, node instead of bun ($V/run-e-mw-node.log): works and is actually richer, the event carries request data and the transaction name, which it does not on bun:
{"type":"event","exception":"Error: probe-api-route-error","mechanism":"solidstart.middleware","handled":false,"transaction":"GET /api/boom","request":{"url":"http://127.0.0.1:41778/api/boom","method":"GET",...}}
So the swallow is a SolidStart 2 / nitro issue, not a bun regression, and the fix is runtime-independent - matching the original report's node cross-check.

RUN F - alternative fix, `entry-server.tsx` keeps the handler and sets `handler.config.onError` ($V/run-f-onerror.log). `createHandler()` returns the h3 app instance (`StartHandler extends H3`), so this reaches the SSR service directly. It fires (`[probe] h3 onError fired probe-api-route-error`) and delivers an event, but by then h3 has already wrapped the throw in an `HTTPError`, so the reported exception chain is `HTTPError` with the real error as a `chained` cause (`{"type":"event","exception":"Error: probe-api-route-error","mechanism":"chained","handled":true,...}` - values[0] is the cause). Grouping would key on `HTTPError`. The middleware is the better shape.

RUN G - remaining gap ($V/run-g-mw-page.log). A component that throws during SSR (`src/routes/page-error.tsx`, `export default function PageError(){ throw new Error('probe-page-render-error') }`) is NOT rescued by the middleware: Solid's renderer catches it inside the render, so `next()` resolves and the middleware sees no throw. Only the transaction arrives:
{"type":"transaction","name":"GET /page-error","op":"http.server","source":"url","status":"internal_error","spans":["middleware GET /page-error","http.server GET /page-error"]}
{"type":"event","exception":"Error: probe-api-route-error","mechanism":"solidstart.middleware","handled":false,...}   <- the API route in the same run
No event for the page render error, before the sentinel. That surface stays dark with every variant I tried.

REFERENCE APP: `~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/solidstart-2/` has no `src/routes/api/**` route and no server-render-throw route at all - its only server error test is the `withServerActionInstrumentation` page. So the SDK's own e2e suite does not cover the case that is broken.

Files (all rerunnable, `node_modules` removed after the run):
- app: $SCRATCH/deep/verify4-M-solidstart-bun-errors/app
  (src/middleware.ts, src/entry-server.tsx, src/routes/api/{boom,boom-async,ok,sentinel}.ts, src/routes/page-error.tsx, src/routes/server-error.tsx, server/plugins/sentry.ts, server/routes/nitro-boom.ts, vite.config.ts)
  Both fixes are gated by env vars so one build covers every variant: `PROBE_MW=1` (middleware) and `PROBE_ONERROR=1` (h3 config.onError).
- Rerun: `cd app && npm install --legacy-peer-deps && npx vite build`; `PORT=41777 node $S/qs/sink.mjs &`; `SENTRY_TUNNEL=http://127.0.0.1:41777/ SENTRY_LIFECYCLE=static PORT=41778 [PROBE_MW=1] bun .output/server/index.mjs`; then `curl 127.0.0.1:41778/api/boom`, `curl 127.0.0.1:41778/api/sentinel`, `curl 127.0.0.1:41777/__items`.
- A stray `app/app/` directory is a copy I made by mistake at the start; nothing reads it (no `rm` allowed).

## Workaround

Add an h3 middleware that wraps `next()` in `src/middleware.ts`. `createMiddleware` accepts a raw h3 `Middleware[]` in SolidStart 2, so this is a supported shape and composes with the Sentry meta-tag middleware:

```ts
// src/middleware.ts
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
```

This catches sync and async throws from `src/routes/**/*.ts` file API routes on both bun and node, in both `traceLifecycle` modes, with context lines and `handled: false`, and it keeps the original error as the top-level exception. It does not catch errors thrown while a page component renders on the server.

Alternative that reaches the same h3 app but reports worse: in `entry-server.tsx`, keep the value from `createHandler(...)` and set `handler.config.onError = error => Sentry.captureException(error, { mechanism: { handled: false, type: '...' } })`. h3 has already wrapped the throw in an `HTTPError` at that point, so the issue groups as `HTTPError` with the real error attached as a chained cause.

## Docs impact

The SolidStart guide must say that on SolidStart 2 an uncaught throw inside a file API route (`src/routes/api/*.ts`) or inside a server-rendered page component does not reach Sentry on its own - SolidStart's SSR service builds its own h3 app with no `onError`, so it turns the throw into a 500 before Nitro's error hook (the one `@sentry/nitro` installs) ever sees it - and the guide must show the `createMiddleware([async (event, next) => { try { return await next() } catch (e) { Sentry.captureException(e, { mechanism: { handled: false, type: 'solidstart.middleware' } }); throw e } }, ...])` middleware as the way to capture API-route errors, noting that page render errors still need `withSentryErrorBoundary`. The "Verify" section is currently wrong for SolidStart 2: `~/dev/sentry-docs/docs/platforms/javascript/guides/solidstart/index.mdx:452-461` tells the user to confirm the setup with `src/routes/sentry-test.tsx` containing `export async function GET() { throw new Error("Sentry Example API Route Error"); }`, which is exactly the case that produces no error event.
