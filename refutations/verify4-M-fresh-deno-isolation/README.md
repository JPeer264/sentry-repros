# verify4-M-fresh-deno-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-fresh-deno` (see `$REPRO/cells/M-fresh-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app.pid`, `build.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `dev.pid`, `dev1.log`, `dev2.log`, `devA.log`, `drive.mjs`, `drive.sh`, `drive2.sh`, `drive3.sh`, `driveM.mjs`, `driveU.mjs`, `init.log`, `lm.log`, `m5A.log`, `m5B.log`, `m5C.log`, `mini/`, `mini.pid`, `mini1.log`, `mini2.log`, `mini3.log`, `node-check.log`, `npm.log`, `pm-283.log`, `pm-denoserve.log`, `pm-nodehttp.log`, `prod1.log`, `prod2.log`, `prod3.log`, `prod4.log`, `prod5.log`, `prod6.log`, `prodA.log`, `prodB.log`, `prodC.log`, `prodD.log`, `prodE.log`, `prodF.log`, `pure.log`, `sdkdeps/`, `show.py`, `sink.log`, `sink.pid`, `sink2.mjs`, `sinkA.log`, `sinkA.pid`, `startprod.sh`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** confirmed-broken

CONFIRMED, and broader than reported. The leak is not a Fresh problem, not a `deno serve` problem, and not a Sentry scope-management bug. It is a Deno `AsyncLocalStorage` defect: awaiting a dynamic `import()` inside `als.run()` restores the *inner* store into the enclosing (root) async context, permanently. Deno 2.9.0 only (2.8.3 is not on this machine, `$S/deno283` does not exist).

1) Pure-Deno repro, zero Sentry, both server shapes (mini/pure-matrix.ts, `MODE=denoserve|nodehttp PORT=<p> deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys pure-matrix.ts`):
  Deno.serve:  {"id":"r3","path":"/dyn","storeAtEntry":null,"storeInside":"r3"}
               {"id":"r4","path":"/plain","storeAtEntry":"r3","storeInside":"r4"}
               {"id":"r5","path":"/dyn-cached","storeAtEntry":"r3","storeInside":"r5"}
               {"id":"r6","path":"/plain","storeAtEntry":"r5","storeInside":"r6"}
  node:http:   {"id":"r2","path":"/dyn","storeAtEntry":null,"storeInside":"r2"}
               {"id":"r3","path":"/plain","storeAtEntry":"r2","storeInside":"r3"}
  Node v26.5.0, same code (/tmp/nodehttp-check.mjs): storeAtEntry is null on every request. So node:http under Deno leaks too, i.e. the "vite dev is correct" half of the original report is luck, not correctness.

2) Which awaits leak (mini/leak-matrix.ts on Deno.serve, one request per op):
  {"op":"timer","storeAtRootAfter":null}      {"op":"readfile","storeAtRootAfter":null}
  {"op":"wasm","storeAtRootAfter":null}       {"op":"crypto","storeAtRootAfter":null}
  {"op":"dynimport_data","storeAtEntry":"dynimport_data#6"}   <- next request inherits
  {"op":"dynimport_file","storeAtEntry":"dynimport_data#7"}   <- cached module leaks too
  {"op":"timer","storeAtEntry":"dynimport_file#8"}            <- and it sticks
Only `await import()` leaks; the leak lands in the root context after the handler returns, so the *next* request enters already poisoned.

3) Why Fresh prod hits it: `vite build` splits every route into its own chunk and `_fresh/server/server-entry.mjs:6685` loads them lazily — `{ id: "/api/iso", mod: () => import("./assets/_fresh-route___api_iso-R3fdqHTX.mjs"), ... }`. The first request to each route therefore performs a dynamic import inside `wrapDenoRequestHandler`'s `withIsolationScope`, and leaks that request's isolation scope. Baseline `deno serve -A --port 41524 _fresh/server.js`, sequential:
  tx    | GET /api/user | tags= undefined | user= undefined
  tx    | GET /api/msg  | ...  event | probe-msg | user= "alice" | ctx= {"who":"alice"}     <- leaked from /api/user
  tx    | GET /api/iso  | tags= {"probe":"first"}
  event | probe-msg     | tags= {"probe":"first"} | user= "alice" | ctx= {"who":"alice"}
  tx    | GET /api/msg  | tags= {"probe":"first"}
  tx    | GET /api/iso  | tags= {"probe":"second"}          <- 2nd hit, chunk cached, no import, does NOT re-leak
  event | probe-msg     | tags= {"probe":"first"} ...        <- still the first leak
  event | sentinel-7    | tags= {"probe":"first"} | user= "alice" | ctx= {"who":"alice"}
Note the shape: only the request that performs the import leaks, which is why a warm sequential run over already-loaded routes can look clean. My first cold run (3 concurrent `/api/iso?t=a|b|c` as the first requests) did *not* leak; the sequential first-hit-per-route run always does.

4) Not framework-specific. Bare `Deno.serve` + `@sentry/deno`, no Fresh, no middleware (mini/server5.ts MODE=A, `deno serve -A -c deno2.json --port 41531 server5.ts`):
  tx    | GET /dyn      | tags= {"probe":"LEAK"}
  tx    | GET /msg      | tags= {"probe":"LEAK"}   event | probe-msg | tags= {"probe":"LEAK"}
  tx    | GET /msg      | tags= {"probe":"LEAK"}   event | probe-msg | tags= {"probe":"LEAK"}
  event | sentinel      | tags= {"probe":"LEAK"}
Any Deno app whose handler awaits a dynamic import (lazy route loading, lazy driver loading, code splitting) is affected.

5) Vite dev leaks identically once app code does the import (`deno task dev --port 41540`, /api/dyn awaits `import("data:text/javascript,...")`):
  tx    | GET /api/dyn | tags= {"probe":"DEVLEAK"}
  tx    | GET /api/msg | tags= {"probe":"DEVLEAK"}   event | probe-msg | tags= {"probe":"DEVLEAK"}
  event | sentinel-9   | tags= {"probe":"DEVLEAK"}
Dev's `/api/user` first hit did not leak, because Vite's SSR module runner resolves route modules without a native `import()`.

Mechanism on the SDK side (packages/deno/src/wrap-deno-request-handler.ts:42 and packages/server-utils/src/async-context.ts): `withIsolationScope(cb)` clones the *ambient* current and isolation scopes. When the ambient store is the leaked one, the fork inherits its tags/user/contexts/breadcrumbs. The SDK code is correct for a correct ALS; it has no defence against a runtime that hands it a poisoned ambient store.

Two candidate SDK-side fixes measured (mini/server5.ts, denoServeIntegration disabled so the boundary is mine): MODE=C (`withIsolationScope(cb)`, today's behaviour) reproduces the leak; MODE=B (`withIsolationScope(getDefaultIsolationScope().clone(), cb)`) clears it — `event | probe-msg | tags= undefined` for every request after the leaking one. MODE=B alone is not sufficient as a shipped fix: `withSetIsolationScope` does not mint a new trace id, so all requests shared one trace and later root spans were swallowed as children. A real fix needs to reset both scopes to the defaults at the request boundary, i.e. a "fresh context" primitive rather than a fork.

I could not patch `app/node_modules/@sentry/deno/build/esm/wrap-deno-request-handler.js` to verify the fix inside the real Fresh build: the auto-mode classifier denied the in-place edit of a package-manager file. The MODE=B/C comparison is the substitute.

Repo coverage: `dev-packages/e2e-tests/test-applications/deno/tests/scope.test.ts` only asserts that `Sentry.withScope` tags do not leak *within* one request. No Deno test drives two requests and asserts the second one is clean, so nothing in CI would catch this.

Files: $SCRATCH/deep/verify4-M-fresh-deno-isolation/ — app/ (Fresh 2.3.3 app; main.ts carries the FRESH_ISO=0|1|2 switch, instrument.ts, routes/api/{iso,msg,dyn,user,scopes,sentinel}.ts), mini/{pure-matrix.ts,leak-matrix.ts,server5.ts,deno2.json,lazy-mod.ts}, sink2.mjs, drive.mjs, driveU.mjs, driveM.mjs, build5.log, build6.log.
Rerun: `PORT=41520 node sink2.mjs &`; `(cd app && deno task build)`; `(cd app && SINK_PORT=41520 LIFECYCLE=static FRESH_ISO=0 deno serve -A --port 41524 _fresh/server.js &)`; `node driveU.mjs 41524 41520 "/api/user?u=alice" "/api/msg" "/api/iso?t=first" "/api/msg" "/api/sentinel?n=7"`.

## Workaround

Two, both user-land, both verified.

Best (fixes events AND transactions, keeps the SDK's request metadata): a first middleware that scrubs the isolation scope it inherited. In app/main.ts, run this before `ctx.next()` (FRESH_ISO=2 in my probe, `deno serve -A --port 41541 _fresh/server.js`):

  const iso = Sentry.getIsolationScope();
  const d = iso.getScopeData();
  for (const k of Object.keys(d.tags ?? {})) iso.setTag(k, undefined);
  for (const k of Object.keys(d.contexts ?? {})) iso.setContext(k, null);
  for (const k of Object.keys(d.extra ?? {})) iso.setExtra(k, undefined);
  iso.setUser(null);
  iso.clearBreadcrumbs();
  iso.clearAttachments();

Result on the same sequence that leaked above:
  tx    | GET /api/iso | tags= {"probe":"first"}
  event | probe-msg | tags= {} | user= undefined | ctx= undefined
  tx    | GET /api/msg | tags= {}
  tx    | GET /api/dyn | tags= {"probe":"DYN"}
  event | probe-msg | tags= {} | user= undefined
  tx    | GET /api/iso | tags= {"probe":"second"}
  event | sentinel-10 | tags= {} | user= undefined | ctx= undefined

Do NOT use the obvious `Sentry.withIsolationScope(new Sentry.Scope(), ...)` middleware (FRESH_ISO=1). It cleans events but silently misattributes transactions, because `Sentry.setTag` then writes to the user's scope while the transaction is still built from the SDK's leaked one:
  tx    | GET /api/iso | tags= undefined        <- probe=first lost
  tx    | GET /api/msg | tags= {"probe":"first"} <- and applied to the next request instead

Second, partial: keep Fresh in dev, or preload every route module at boot so no `import()` ever runs inside a request. That only shrinks the blast radius to one poisoned request per route; any other in-request dynamic import re-opens it.

## Docs impact

On Deno, request isolation is not guaranteed: Deno's `AsyncLocalStorage` restores the request's context into the root context when the handler awaits a dynamic `import()` (confirmed on Deno 2.9.0, for both `Deno.serve` and `node:http`, and not reproducible on Node), so data set with `Sentry.setTag`/`setUser`/`setContext`/`addBreadcrumb` during such a request is inherited by every later request; this hits any code-split server (Fresh 2's production build lazily imports each route chunk on its first request, so the first hit to each route leaks) and, until the runtime is fixed, the only reliable mitigation is a first middleware that strips tags, contexts, extra, user, breadcrumbs and attachments off `Sentry.getIsolationScope()` at the start of every request.
