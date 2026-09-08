# verify4-M-remix-cf-errors

## What it re-tests

Independent re-test of the capability **errors** of cell `M-remix-cf` (see `$REPRO/cells/M-remix-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `NOTES-verify4.txt`, `README-rerun.txt`, `app/`, `build-A.log`, `build-B.log`, `build-C.log`, `build-S.log`, `build-docs.log`, `install.log`, `package-lock.json`, `package.json`, `server.ts`, `server.ts.bak`, `sink-run.log`, `sink.log`, `sink.pid`, `sinkpid.txt`, `tsconfig.json`, `vite.config.ts`, `wr-C.log`, `wr-S.log`, `wr-docs.log`, `wr-patch.log`, `wrangler-A.log`, `wrangler.jsonc`, `wrangler.pid`, `wrpid.txt`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Reproduced independently in $SCRATCH/deep/verify4-M-remix-cf-errors (Remix 2.17.5 + Remix Vite plugin, wrangler 4.129.0 dev, compatibility_date 2026-05-01, nodejs_compat, develop SDK 10.67.0, sink 38411 / worker 38412). Could not refute the claim; it is correct and the real situation is worse than reported.

1) CONFIRMED, and worse: the DOCUMENTED snippet captures nothing. ~/dev/sentry-docs/platform-includes/getting-started-complete/javascript.remix.mdx:321-342 tells you to write `import * as Sentry from '@sentry/remix'; export const handleError = Sentry.sentryHandleError;`. On a workerd SSR build that specifier resolves to the BROWSER build, because the "." exports map in packages/remix/package.json lists `browser` BEFORE `worker`, and Vite's webworker SSR environment has both conditions active. `npx remix vite:build` only warns:
  app/entry.server.tsx (7:34): "sentryHandleError" is not exported by "node_modules/@sentry/remix/build/esm/index.client.js", imported by "app/entry.server.tsx".
The build succeeds, `handleError` is `undefined` at runtime, and only the thrown Response is captured (build-docs.log, /__items):
  {"type":"transaction","name":"GET /boom/:id","status":"internal_error","spans":["function routes/boom.$id","function GET /boom/:id"]}   <- no event
  {"type":"transaction","name":"GET /api/boom","status":"internal_error"}                                                                <- no event
  {"type":"transaction","name":"POST /act","status":"internal_error"}                                                                    <- no event
  {"type":"event","exception":"Error: remix-cf thrown response 1","mechanism":"auto.function.remix.server","handled":false}               <- only this one
Verified at the module level too: require('@sentry/remix/build/cjs/index.client.js').sentryHandleError === undefined.

2) With no handleError export at all (build-A.log): boom=500, api/boom=500, zero error events, sentinel-a arrived. Matches the reporter's baseline exactly.

3) Working shape (build-B.log), the one change that fixes it: `import * as Sentry from '@sentry/remix/cloudflare'` (the /cloudflare subpath has no `browser` key, so it resolves correctly). All four error shapes captured, each correlated with its transaction:
  {"type":"event","exception":"Error: remix-cf loader error 2","mechanism":"auto.function.remix.server","handled":false,"trace_id":"2ddafe80..."} + {"type":"transaction","name":"GET /boom/:id","status":"internal_error","trace_id":"2ddafe80..."}
  {"type":"event","exception":"Error: remix-cf resource route error",...,"trace_id":"4bf278e0..."} + {"type":"transaction","name":"GET /api/boom","trace_id":"4bf278e0..."}
  {"type":"event","exception":"Error: remix-cf action error",...,"trace_id":"7d3a114b..."} + {"type":"transaction","name":"POST /act","trace_id":"7d3a114b..."}

4) Other trace lifecycle (build-S.log): removing traceLifecycle (stream default) changes nothing for errors:
  {"type":"event","exception":"Error: remix-cf loader error 6","mechanism":"auto.function.remix.server","handled":false}
  {"type":"span","items":["function routes/boom.$id","function GET /boom/:id","http.server GET /boom/:id"]}

5) Root cause of the "handleError is mandatory" half: packages/remix/src/server/instrumentServer.ts:442-500 `instrumentBuildCallback` already clones `build.entry.module` and wraps `default` (documentRequest) plus every route loader/action, but it never touches `entry.module.handleError`; `grep -n handleError packages/remix/src/` shows only the JSDoc and the two helper definitions. So nothing in the SDK auto-installs it. I proved a 6-line fix works: patching the built `instrumentBuildCallback` with
  if (!wrappedEntry.module.handleError) { wrappedEntry.module.handleError = sentryHandleError; }
  else if (!wrappedEntry.module.handleError.__sentry_original__) { fill(wrappedEntry.module, "handleError", wrapHandleErrorWithSentry); }
made ALL four error shapes capture with NO user-side handleError export, and did not duplicate the thrown Response (sentryHandleError skips Responses):
  {"type":"event","exception":"Error: remix-cf loader error 4",...} / "Error: remix-cf resource route error" / "Error: remix-cf action error" / "Error: remix-cf thrown response 4" (one event each). Patch reverted afterwards.

6) Additional gap: `wrapHandleErrorWithSentry` is not exported from `@sentry/remix/cloudflare` at all (packages/remix/src/cloudflare/index.ts re-exports only `sentryHandleError` and `makeWrappedCreateRequestHandler`); `require('@sentry/remix/build/cjs/cloudflare/index.js').wrapHandleErrorWithSentry === undefined`. The docs' preferred variant (wrap your own handler) therefore has no Cloudflare equivalent.

7) The repo's own reference app corroborates the hole: dev-packages/e2e-tests/test-applications/remix-hydrogen (the only Workers-runtime Remix app, wrapRequestHandler + instrumentBuild) has NO handleError export anywhere and no server-error test (tests/ has only client-errors, client-transactions, server-timing-header, server-transactions). Every Node Remix e2e app (create-remix-app-v2, create-remix-app-express, remix-server-timing) does export handleError.

Files: server.ts, vite.config.ts, wrangler.jsonc, app/entry.server.tsx, app/routes/{boom.$id,boomresp.$id,api.boom,act,sentinel}.tsx, NOTES-verify4.txt (rerun recipe + variant->log map), build-{docs,A,B,C,S}.log, wr-{docs,patch,C,S}.log. node_modules removed after the run; reinstall with `npm install --legacy-peer-deps` (package-lock.json is committed in the dir).

## Workaround

Two changes on top of the reported wiring. (a) Import from the Cloudflare subpath, not the bare package, in app/entry.server.tsx: `import * as Sentry from '@sentry/remix/cloudflare'; export const handleError = Sentry.sentryHandleError;`. (b) If you must keep the docs-verbatim `@sentry/remix` specifier, force the worker condition ahead of browser in vite.config.ts: `ssr: { target: 'webworker', resolve: { conditions: ['workerd', 'worker', 'module', 'import', 'default'], externalConditions: ['workerd', 'worker'] }, noExternal: true }` — verified in build-C.log, the rollup "not exported" warning disappears and loader/action errors are captured. A third, entry.server-free option that also works: in server.ts do `const build = instrumentBuild(remixBuild); build.entry.module.handleError = sentryHandleError;` before `createRequestHandler(build, 'production')`. Do not use `wrapHandleErrorWithSentry` on Cloudflare, it is not exported from `@sentry/remix/cloudflare`; hand-roll `export const handleError = (err, args) => { myHandler(err, args); Sentry.sentryHandleError(err, args); }` instead.

## Docs impact

On Cloudflare Workers, Remix server errors are only captured if `entry.server.tsx` exports `handleError`, and that import MUST come from `@sentry/remix/cloudflare` — importing `sentryHandleError` from the bare `@sentry/remix` specifier resolves to the browser build in a workerd SSR build, leaves `handleError` undefined, and silently drops every loader, action, and resource-route error while the build emits only a rollup warning; `wrapHandleErrorWithSentry` is not available on the Cloudflare entry point, so wrap your own handler by calling `sentryHandleError` from it.
