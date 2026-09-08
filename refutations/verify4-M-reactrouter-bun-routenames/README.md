# verify4-M-reactrouter-bun-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-reactrouter-bun` (see `$REPRO/cells/M-reactrouter-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-bun-noinstr.log`, `app-bun-static.log`, `app-bun-static2.log`, `app-bun-stream.log`, `app-bun1314-static.log`, `app-final.log`, `app-final2.log`, `app-final3.log`, `app-node-static.log`, `app-node.log`, `build-v2.log`, `build-v3.log`, `build-v4.log`, `entry.server.NO-instrumentation.tsx`, `entry.server.WITH-instrumentation.keep.tsx`, `entry.server.WITH-instrumentation.tsx`, `items-bun-noinstr.json`, `items-bun-static.json`, `items-bun-static2.json`, `items-bun-stream.json`, `items-bun1314-static.json`, `items-node-static.json`, `raw-bun-noinstr.json`, `raw-bun-static.json`, `raw-bun-static2.json`, `raw-bun-stream.json`, `raw-bun1314-static.json`, `raw-node-static.json`, `run.sh`, `run2.sh`, `sink.log`, `sink.pid`, `users1.html`, `v2-app-bun-static-nowrap.log`, `v2-app-bun-static.log`, `v2-app-bun-stream.log`, `v2-app-node-static.log`, `v2-items-bun-static-nowrap.json`, `v2-items-bun-static.json`, `v2-items-bun-stream.json`, `v2-items-node-static.json`, `v2-sink.log`, `v2-sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. React Router 8 framework mode on Bun 1.4.0 with @sentry/react-router 10.67.0 (develop) does produce server transactions/spans with parameterized route names, in BOTH lifecycles. The prior probe's app was missing one line of the documented wiring.

THE ONE CHANGE (in `app/entry.server.tsx`):
`export const instrumentations = [Sentry.createSentryServerInstrumentation()];`

That is React Router 8's own `instrumentations` export. The SDK's `createSentryServerInstrumentation()` (packages/react-router/src/server/createServerInstrumentation.ts:55) is called directly by React Router, so it needs no diagnostics-channel injection and no node:http patching. Its `request` hook explicitly handles the "no existing root span" case (`if (existingRootSpan) { updateSpanName(...) } else { await startSpan({ name: unparameterizedName, ... }) }`), i.e. it starts the HTTP server span itself when @sentry/node has not created one. That is exactly the Bun situation. The `No diagnostics-channel injection detected` warning is real and unchanged, and is irrelevant to this capability.

EVIDENCE, bun 1.4.0, traceLifecycle 'static' ($S/deep/verify4-M-reactrouter-bun-routenames/v2-items-bun-static.json, verbatim, trimmed):
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.react-router","spans":["function /users/:id"]}
  {"type":"event","exception":"Error: loader boom on bun","mechanism":"react_router.loader","handled":false,"transaction":"GET /users/:id"}
  {"type":"transaction","name":"GET /","op":"http.server","source":"route","status":"ok","spans":["function /"]}
  {"type":"transaction","name":"GET /flush","op":"http.server","source":"route","status":"ok","spans":["function /flush"]}

EVIDENCE, bun 1.4.0, traceLifecycle 'stream' (v2-items-bun-stream.json, span envelope raw entries):
  {"name":"GET /users/:id","status":"ok","is_segment":true,"origin":"auto.http.react_router.instrumentation_api"}
  {"name":"/users/:id","status":"ok","is_segment":false,"origin":"auto.function.react_router.instrumentation_api"}
  {"name":"GET /","status":"ok","is_segment":true,"origin":"auto.http.react_router.instrumentation_api"}
  {"name":"GET /flush","status":"ok","is_segment":true,"origin":"auto.http.react_router.instrumentation_api"}

Each specific sub-claim of the report is refuted:
- "No server transaction or span envelope is produced at all on Bun, in either lifecycle" — false, see both blocks above.
- "The error event for GET /users/1?mode=error has transaction: undefined" — false, it is `"transaction":"GET /users/:id"`, and the mechanism sharpens from `react-router` to `react_router.loader`.
- "In the loader Sentry.getActiveSpan() is null on every request" — false. The loader probe (`app/app/routes/users.tsx` renders `Sentry.getActiveSpan()`) prints `SPAN[desc=none op=none root=none]` instead of `NO-ACTIVE-SPAN`; the span exists, its name is simply not assigned until React Router matches the route.
- "Identical with traceLifecycle 'static' and 'stream'" — true only in the sense that both now work.

MINIMALITY: `wrapSentryHandleRequest` is NOT needed for route names. With `export default handleRequest;` (unwrapped) and only the `instrumentations` export, names are still `GET /users/:id` / source `route` (v2-items-bun-static-nowrap.json). The Sentry Vite plugin is not needed either — this app's vite.config.ts has only `tailwindcss()` and `reactRouter()`.

NO NODE REGRESSION: same build under `node` gives one transaction per request, `GET /users/:id`, source `route`, plus the Express middleware spans (v2-items-node-static.json). Adding the export does not double-instrument.

The report's Bun-specific setup facts hold and are NOT refuted: the stock template's `renderToPipeableStream` entry cannot run on Bun (`react-dom/server` resolves to `server.bun.js`), so the entry must be rewritten to `renderToReadableStream`, and `Sentry.createSentryHandleRequest({ renderToPipeableStream, createReadableStreamFromReadable })` — the wiring the docs and the repo e2e app `react-router-8-framework` show — is unusable on Bun. The refutation is that this does not cost you route names, because the `instrumentations` export is an independent, runtime-agnostic path.

REMAINING (separate capabilities, not route names): on Bun every request in a run shares one trace_id (`88278811acb34c09a0409425f8dd2d43` for all 7 items) while node gives 5 distinct ones — request isolation is still broken; the error request's transaction is `status:"ok"` on Bun vs `internal_error` on node; and `request`/`user.ip_address` are absent from Bun events.

RERUN: files in $SCRATCH/deep/verify4-M-reactrouter-bun-routenames/ (node_modules intact, 197M).
  PORT=53411 node $S/qs/sink.mjs > v2-sink.log 2>&1 &
  cd app && NODE_ENV=production npx react-router build
  ./run2.sh bun static bun-static      # also: ./run2.sh bun stream bun-stream, ./run2.sh node static node-static
Key files: app/app/entry.server.tsx (the fixed entry, also saved as entry.server.WITH-instrumentation.tsx; entry.server.NO-instrumentation.tsx is the prior probe's broken one), app/instrument.server.mjs, app/server.js, app/app/routes/users.tsx, run2.sh. Sink and app processes were killed; ports 53411/53412 are free.

NOT RUN: the bun 1.3.14 CI-pin cross-check. `$S/bun1314/bun-darwin-aarch64/bun` no longer exists on disk (`ls: .../bun1314: No such file or directory`), and a filesystem search found no other copy.

## Workaround

Add `export const instrumentations = [Sentry.createSentryServerInstrumentation()];` to `app/entry.server.tsx`. This is the whole fix; it is documented (sentry-docs manual-setup.mdx:286) but was omitted in the probe app. On Bun it is not optional the way it is on Node: it is the only source of server spans, because @sentry/node cannot inject into node:http there. The entry still has to use `renderToReadableStream` on Bun, and `Sentry.createSentryHandleRequest({ renderToPipeableStream, createReadableStreamFromReadable })` still cannot be used — neither of which matters for route names once the `instrumentations` export is present. `Sentry.wrapSentryHandleRequest` is optional for this capability.

## Docs impact

On Bun, `export const instrumentations = [Sentry.createSentryServerInstrumentation()]` in your server entry is required rather than optional: it is the only source of server spans and parameterized route names, because Bun has no diagnostics-channel injection for `node:http`, so the `createSentryHandleRequest` wiring (which also cannot be used on Bun, since `react-dom/server` there exports only `renderToReadableStream`, not `renderToPipeableStream`) never gets a request span to rename.
