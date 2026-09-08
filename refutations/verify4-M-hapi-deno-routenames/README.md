# verify4-M-hapi-deno-routenames

## What it re-tests

Independent re-test of the capability **route names** of cell `M-hapi-deno` (see `$REPRO/cells/M-hapi-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN-v4.md`, `RERUN.md`, `app-body-manual.ts`, `app-body-manual2.ts`, `app-body.ts`, `app-control-unpatched.log`, `app-deleg-static.log`, `app-fixfirst-static.log`, `app-flagimport-static.log`, `app-hookfix-static.log`, `app-nohook-static.log`, `app-plain-static.log`, `app-sdkpatch-static.log`, `app-sdkpatch-stream.log`, `app-v4-control-unpatched.log`, `app-v4-deno283-plain.log`, `app-v4-fixfirst-static.log`, `app-v4-flagimport-nojsonfix.log`, `app-v4-hookfix-static.log`, `app-v4-hookfix-stream.log`, `app-v4-manual-nohook-static.log`, `app-v4-manual2-nohook-static.log`, `app-v4-manual2-nohook-stream.log`, `app-v4-nohook-stream.log`, `deno.json`, `init.ts`, `items-deleg-static.json`, `items-fixfirst-static.json`, `items-flagimport-static.json`, `items-hookfix-static.json`, `items-nohook-static.json`, `items-sdkpatch-static.json`, `items-sdkpatch-stream.json`, `items-v4-fixfirst-static.json`, `items-v4-hookfix-static.json`, `items-v4-hookfix-stream.json`, `items-v4-manual-nohook-static.json`, `items-v4-manual2-nohook-static.json`, `items-v4-manual2-nohook-stream.json`, `items-v4-nohook-stream.json`, `json-fix-delegating.mjs`, `json-fix.mjs`, `main-fixfirst.ts`, `main-hookfix-delegating.ts`, `main-hookfix.ts`, `main-manual-nohook.ts`, `main-manual2-nohook.ts`, `main-nohook.ts`, `main-plain.ts`, `minrepro/`, `package-lock.json`, `package.json`, `run.sh`, `sink.log`, `sink.pid`, `sink2.log`, `sink2.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Re-ran the whole matrix on a PRISTINE develop tree (10.67.0 tarballs; the earlier agent had left an experimental `result.format = "json"` patch inside node_modules/@sentry/server-runtime-injection/build/{esm,cjs}/vendored/@apm-js-collab/tracing-hooks/hook.js — I deleted it before every run and verified `grep -c` == 0, so nothing below is confounded by it). Deno 2.9.0, @hapi/hapi 21.4.10, deno.json nodeModulesDir "manual", mysql@2 on 127.0.0.1:3307. Sink 41731, app 51837. Probe dir $SCRATCH/deep/verify4-M-hapi-deno-routenames/ (RERUN-v4.md has the full table).

The reported capability holds in substance: AUTOMATIC hapi route names on Deno need the undocumented `import "@sentry/deno/import"` hook AND a user-land JSON load-hook workaround, otherwise the app does not boot.

CONTROL, hook without the JSON fix (`./run.sh main-plain.ts static v4-control-unpatched`):
  error: Uncaught (in promise) SyntaxError: Unexpected token ':'
  const Pkg = require('../package.json');
      at Object.<anonymous> (.../node_modules/@hapi/validate/lib/common.js:6:13)
Registering the hook via the flag instead of the import crashes identically (`./run.sh main-nohook.ts static v4-flagimport-nojsonfix --import=./node_modules/@sentry/deno/build/import.mjs`), so there is no flag-shaped escape.

WITH hook + json-fix.mjs, static (v4-hookfix-static):
  {"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","spans":["router GET /users/{id}"]}
  {"type":"transaction","name":"GET /db","op":"http.server","source":"route","spans":["router GET /db","db SELECT * FROM users"]}
stream (v4-hookfix-stream):
  {"type":"span","items":["router /users/{id}","http.server GET /users/{id}"],"raw":[{"name":"/users/{id}","origin":"auto.http.hapi"},{"name":"GET /users/{id}","is_segment":true,"origin":"auto.http.server"}]}

WITHOUT the hook (v4-nohook-static / v4-nohook-stream), reproduced exactly as reported:
  {"type":"transaction","name":"GET /users/42","op":"http.server","source":"url","spans":[]}
  {"type":"span","items":["http.server GET"],"raw":[{"name":"GET","is_segment":true,"origin":"auto.http.server"}]}

Two specifics of the report are REFUTED:
1. "json-fix.mjs must be imported AFTER @sentry/deno/import" is false. main-fixfirst.ts imports json-fix.mjs FIRST, then the hook, then init, then the app (v4-fixfirst-static) and produces byte-identical telemetry: `"name":"GET /users/{id}","source":"route","spans":["router GET /users/{id}"]`. Order of the two hook registrations does not matter.
2. Route names do NOT actually require the hook or the JSON workaround. With plain documented wiring (init + app, no `@sentry/deno/import`, no json-fix) plus a 6-line hapi `ext`, names are fully parameterized in both lifecycles — v4-manual2-nohook-static:
  {"type":"transaction","name":"GET /users/{id}","op":"http.server","source":"route","status":"ok","spans":[]}
  {"type":"transaction","name":"GET /db","op":"http.server","source":"route","status":"ok","spans":[]}
v4-manual2-nohook-stream:
  {"type":"span","items":["http.server GET /users/{id}"],"raw":[{"name":"GET /users/{id}","is_segment":true,"origin":"auto.http.server"}]}
What you lose without the hook is only the `router` child span, the mysql `db` span and the `auto.function.hapi` unhandled-error capture — not the route name.

Gotcha found while building that: `Sentry.getRootSpan(span).updateName(...)` forces the segment name source to `custom` (core spanUtils.js:254-265, INTERNAL_setSegmentNameSourceIfSegment). Setting the plain string `'sentry.source'` afterwards does nothing (v4-manual-nohook-static gave `"name":"GET /users/{id}","source":"custom"`); you must set the exported `Sentry.SENTRY_SEGMENT_NAME_SOURCE` key (`sentry.segment.name.source`) to `'route'` after updateName.

Why CI never sees this: the repo's own Deno hapi test, ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/deno-integration-tests/suites/orchestrion-hapi/test.ts, never imports @hapi/hapi — it hand-publishes `orchestrion:@hapi/hapi:route` on the diagnostics channel against a fake route object, so the real import path under Deno's load hook is untested. The root defect is Deno's (denoland/deno#36240): with any Module.registerHooks load hook registered, `nextLoad` returns `format: undefined` for a .json URL and Deno then compiles it as CJS; the SDK's loadSync passes such results straight through untouched (hook.js:113-128).

Not run: Deno 2.8.3 (the $SCRATCH/deno283 pin has been cleaned off disk) and nodeModulesDir "auto" (the JSON defect is in Deno's load-hook chain, independent of resolution mode).

## Workaround

Two, and they are independent. (A) For route names only, no hook and no JSON fix needed — keep the documented wiring (`import * as Sentry from "@sentry/deno"; Sentry.init(...)`) and add to the hapi server: `server.ext('onPreHandler', (request, h) => { const a = Sentry.getActiveSpan(); if (a) { const root = Sentry.getRootSpan(a); root.updateName(`${request.method.toUpperCase()} ${request.route.path}`); root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route'); root.setAttribute('http.route', request.route.path); } return h.continue; });` — the SENTRY_SEGMENT_NAME_SOURCE line must come after updateName, which otherwise leaves source `custom`. Gives `GET /users/{id}` source `route` in static and `http.server GET /users/{id}` in stream. (B) For full hapi instrumentation (router span, db spans, unhandled route errors) you still need `import "@sentry/deno/import"` plus a JSON load hook in the same entry: `import * as Module from 'node:module'; import { readFileSync } from 'node:fs'; import { fileURLToPath } from 'node:url'; Module.registerHooks({ load(url, ctx, next) { return url.endsWith('.json') ? { format: 'json', source: readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true } : next(url, ctx); } });` — it can be imported before or after `@sentry/deno/import`, order does not matter, but it must come before the app.

## Docs impact

The Deno guide should state that `@sentry/deno` alone names server transactions from the URL (`GET /users/42`, source `url`) and that parameterized hapi route names require either a `server.ext('onPreHandler')` that calls `getRootSpan(getActiveSpan()).updateName('<METHOD> ' + request.route.path)` followed by `setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route')`, or the `import "@sentry/deno/import"` instrumentation hook, which on Deno 2.9 additionally requires a user-registered `Module.registerHooks({ load })` that returns `{ format: 'json' }` for `.json` URLs, because Deno (denoland/deno#36240) otherwise compiles `require('*.json')` as JavaScript and @hapi/validate fails to load at import time.
