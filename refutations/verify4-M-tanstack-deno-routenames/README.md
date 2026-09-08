# verify4-M-tanstack-deno-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-tanstack-deno` (see `$REPRO/cells/M-tanstack-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `FINAL-deno-items.jsonl`, `FINAL-deno-stream-items.jsonl`, `FINAL-deno-stream.log`, `FINAL-deno.log`, `app/`, `app-pnpm/`, `build-FINAL-rerun.log`, `build-alias.log`, `build-alias2.log`, `build-crd.log`, `build-final.log`, `build-nodb.log`, `build-noext.log`, `build-plain.log`, `build-pnpm-pristine.log`, `build-pnpm-pristine2.log`, `build-vite7-noext-db.log`, `build-vite7-noext.log`, `build-vite8-db.log`, `build-vite8.log`, `deno-FINAL.log`, `deno-stream.log`, `deno.log`, `deno2.log`, `deno3.log`, `denopid`, `denopid2`, `denopid3`, `denopid4`, `install-pnpm.log`, `install-rerun.log`, `install-rerun2.log`, `install-vite7.log`, `install-vite8.log`, `node-FINAL.log`, `nodepid`, `pnpm-rebuild.log`, `rerun-build-pristine-vite7.log`, `rerun-build-pristine.log`, `rerun-deno-pristine.log`, `rerun-deno.log`, `rerun-node.log`, `rerun-sink.log`, `sink.log`, `sink2.log`, `sinkpid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. Parameterized server transaction names work on Deno 2.9.0 with @sentry/tanstackstart-react 10.67.0 (develop). The reported mechanism is right (the `__SENTRY_ROUTE_PATTERNS__` build-time constant is only substituted while the SDK goes through Vite's transform pipeline) but the conclusion is wrong on two counts: (a) it is fixed by one line of vite.config.ts, no custom plugin needed; (b) it is not Deno-specific in either direction — the broken build config gives url names under node too, and the fixed build gives route names under both.

Exact change, in `vite.config.ts`, replacing the bare `nitro()` from the docs shape:

    import { nitro } from 'nitro/vite';
    ...
    nitro({ noExternals: ['@sentry/tanstackstart-react'] }),

That forces nitro to bundle the SDK into the server output instead of leaving it as a bare `@sentry/tanstackstart-react` import, so `sentry-tanstackstart-route-patterns` (packages/tanstackstart-react/src/vite/routePatterns.ts) actually sees `wrapFetchWithSentry` and inlines the array. Verified in the build output at
.output/server/_libs/sentry__tanstackstart-react.mjs:110 — `updateSpanWithRouteParametrization(method, url.pathname, ["/api/user/$id", ..., "/param/$id", "/users/$userId", ...])`.

A/B on the SAME app, same deno command, same sink. Deno 2.9.0, `PORT=<p> deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi deno-entry.mjs` where deno-entry.mjs is `import './instrument.server.mjs'; import './index.mjs';`.

BROKEN — pristine documented config (bare `nitro()`, byte-identical to dev-packages/e2e-tests/test-applications/tanstackstart-react/vite.config.ts), vite 8.2.2, build exits 0, no `_libs/sentry__*.mjs` in the output:
{"type":"transaction","name":"GET /api/user/42","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.tanstackstart-react"}
{"type":"transaction","name":"GET /param/42","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.tanstackstart-react"}
{"type":"transaction","name":"GET /users/123","op":"http.server","source":"url","status":"ok","sdk":"sentry.javascript.tanstackstart-react"}

WORKS — same app with `nitro({ noExternals: ['@sentry/tanstackstart-react'] })`, traceLifecycle 'static', under Deno:
{"type":"transaction","name":"GET /api/user/$id","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.tanstackstart-react","spans":["middleware globalRequestMiddleware"]}
{"type":"transaction","name":"GET /param/$id","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.tanstackstart-react","spans":["middleware globalRequestMiddleware"]}
{"type":"transaction","name":"GET /users/$userId","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.tanstackstart-react","spans":["middleware globalRequestMiddleware"]}
{"type":"transaction","name":"GET /api/error","op":"http.server","source":"route","status":"internal_error","sdk":"sentry.javascript.tanstackstart-react"}
(the /api/error event carries "transaction":"GET /api/error" and mechanism auto.middleware.tanstackstart.request, so the error is grouped under the parametrized name too)

WORKS — same build, traceLifecycle 'stream', under Deno (the other lifecycle, as asked):
{"type":"span","items":["middleware globalRequestMiddleware","http.server GET /api/user/$id"],"raw":[{"name":"GET /api/user/$id","status":"ok","is_segment":true,"origin":"auto.http.http_server"}]}
{"type":"span","items":["middleware globalRequestMiddleware","http.server GET /users/$userId"],"raw":[{"name":"GET /users/$userId","status":"ok","is_segment":true,"origin":"auto.http.http_server"}]}

NODE CONTROL — same fixed .output, `PORT=43222 node --import ./instrument.server.mjs index.mjs` on node v26.5.0, also route-sourced:
{"type":"transaction","name":"GET /api/user/$id","op":"http.server","source":"route","status":"ok"}
{"type":"transaction","name":"GET /param/$id","op":"http.server","source":"route","status":"ok"}
{"type":"transaction","name":"GET /users/$userId","op":"http.server","source":"route","status":"ok"}

Two corrections to the probe's setup story:
1. The custom "externalize every @sentry/* + virtual default-export shim" pre-plugin is NOT required. It was the thing that broke route names — it is the opposite of what this SDK needs. The reported `"default" is not exported by @sentry/conventions/dist/attributes.mjs` rollup failure did not reproduce; with vite 8.2.2 the pristine config builds clean under both npm --legacy-peer-deps and there is no need to touch @sentry externals to make it compile.
2. The build fragility that presumably drove them there is a vite-version issue, not an install-manager or Deno issue. vite 7.3.2 (the version the repo's own e2e app pins) + nitro 3.0.260903-beta crashes rollup 4.63.1 with `Cannot read properties of null (reading 'getVariableForExportName')` here, and it does so identically under npm and under pnpm 10 with the reference app copied verbatim. vite 8.2.2 builds fine. So "vite build fails outright" is real but is fixed by moving the vite version, not by externalizing Sentry.

Wider finding worth carrying forward: on the documented config the SDK ends up external in the nitro server bundle, which silently no-ops route parametrization on EVERY runtime. dev-packages/e2e-tests/test-applications/tanstackstart-react/tests/route-parametrization.test.ts:31,60,80 asserts `GET /param/$id` / source 'route', so either CI resolves a nitro/vite combination that bundles the SDK, or that test is currently not exercising what it thinks. The build-time-constant design has no runtime fallback and emits no warning when the substitution did not happen.

Probe files (rerunnable): $SCRATCH/deep/verify4-M-tanstack-deno-routenames/
  app/vite.config.ts               fixed config (nitro noExternals)
  app/vite.config.pristine.ts      documented config, reproduces the url names
  app/package.json                 npm tarball deps, vite ^8.2.2, nitro 3.0.260903-beta
  app/src/                         verbatim copy of the repo e2e app src
  app/.output/server/{instrument.server.mjs,deno-entry.mjs}
  app-pnpm/                        pnpm + vite 7.3.2 reference-faithful build (fails at rollup)
  FINAL-deno-items.jsonl, FINAL-deno-stream-items.jsonl, rerun-deno-pristine.log,
  build-FINAL-rerun.log, rerun-build-pristine.log, build-pnpm-pristine2.log
Commands: `cd app && npm install --legacy-peer-deps && node node_modules/@swc/core/postinstall.js && npx vite build` (add `--config vite.config.pristine.ts` for the broken variant), then `PORT=43117 node $REPRO/_toolbox/sink.mjs &`, point instrument.server.mjs `tunnel` at it, `cd .output/server && PORT=43224 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi deno-entry.mjs`.

## Workaround

Add `noExternals: ['@sentry/tanstackstart-react']` to the `nitro()` Vite plugin options: `nitro({ noExternals: ['@sentry/tanstackstart-react'] })`. Nitro then bundles the SDK into the server output instead of leaving it a bare import, so `sentryTanstackStart()`'s route-pattern plugin can substitute `__SENTRY_ROUTE_PATTERNS__` inside `wrapFetchWithSentry`. Verify it landed with `grep -l 'users/\$userId' .output/server/_libs/sentry__tanstackstart-react.mjs` before deploying. Also use vite 8.x; vite 7.3.2 with nitro 3.0.260903-beta crashes rollup during the server build regardless of Sentry.

## Docs impact

In the TanStack Start guide (~/dev/sentry-docs/docs/platforms/javascript/guides/tanstackstart-react/manual-setup/index.mdx and features/sentryTanstackStart.mdx, neither of which mentions nitro externals today), the vite.config example must read `nitro({ noExternals: ['@sentry/tanstackstart-react'] })` with the note: "Nitro must bundle `@sentry/tanstackstart-react` into the server output. If it is left as an external dependency, the Sentry Vite plugin cannot inject your route patterns and server transactions will be named by raw URL (`GET /users/123`) instead of by route (`GET /users/$userId`); no warning is emitted, so confirm with `grep '\$' .output/server/_libs/sentry__tanstackstart-react.mjs` after building." Add that running the nitro `node` output under Deno needs no Sentry-specific change beyond a two-line entry (`import './instrument.server.mjs'; import './index.mjs';`) next to `index.mjs`, since Deno has no `node --import`.
