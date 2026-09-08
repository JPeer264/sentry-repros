# verify4-M-remix-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-remix-bun` (see `$REPRO/cells/M-remix-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `README-rerun-b.txt`, `README-rerun.txt`, `app/`, `build-c.ts`, `build-db.ts`, `build-final.ts`, `build-final2.ts`, `build-final3-noexternal.ts`, `build-fix2.ts`, `build-fix3.ts`, `build-fix4.ts`, `build-mini.ts`, `build-noshim.ts`, `build-server-fix.ts`, `build-server.ts`, `db.mjs`, `dc-bindstore-probe.mjs`, `instrument.mjs`, `mini-a.log`, `mini-b.log`, `mini.mjs`, `modeA.log`, `modeA.pid`, `modeA2.log`, `modeA2.pid`, `modeB.log`, `modeB.pid`, `modeFinal.log`, `modeFinal.pid`, `modeFix.log`, `modeFix.pid`, `modeFix2.log`, `modeFix2.pid`, `modeFix3.log`, `modeFix3.pid`, `modeFix4.log`, `modeFix4.pid`, `modeNoshim.log`, `modeNoshim.pid`, `modeP.log`, `modeP.pid`, `package-lock.json`, `package.json`, `public/`, `run-b-drive.sh`, `run-b-modeB-items.json`, `run-b-modeB.log`, `run-b-modeC-items.json`, `run-b-modeC.log`, `run-b-modeC2.log`, `run-b-modeFinal-items.json`, `run-b-modeFinal.log`, `run-b-modeFinal2-items.json`, `run-b-modeFinal2.log`, `run-b-modeFinal3.log`, `run-b-sink.log`, `server-final.mjs`, `server-final2.mjs`, `server-fix.mjs`, `server-fix2.mjs`, `server-fix3.mjs`, `server-partial.mjs`, `server.mjs`, `sink.log`, `sink.pid`, `tsconfig.json`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED the "db spans and isolation are mutually exclusive on Bun" part; db spans themselves reconfirmed working on the Bun bundle path. All probes: $SCRATCH/deep/verify4-M-remix-bun-dbspans/ (Remix 2.17 vite build + @remix-run/express, @sentry/remix 10.67.0 from $REPRO/_toolbox/pack, Bun 1.4.0, traceLifecycle 'static', module-scope mysql2 pool in db.mjs, sink on 41337).

1) Mode B reproduced exactly (bun build-server.ts; bun dist/server.js). db spans present, isolation gone — run-b-modeB-items.json:
{"type":"transaction","name":"GET db","op":"http.server","source":"route","trace_id":"e2009f764907456598e242eabcd51c57","spans":["function LOADER routes/db","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"event","exception":"Error: iso-error-a",...,"trace_id":"e2009f764907456598e242eabcd51c57","tags":{"probe_tag":"tag-b"}}
{"type":"event","exception":"Error: iso-error-c",...,"trace_id":"e2009f764907456598e242eabcd51c57","tags":{"probe_tag":"tag-b"}}
(every envelope in the process shares one trace id; the incoming sentry-trace aaaaaaaa…-1111111111111111 is ignored.)

2) The obvious fix — re-externalize @remix-run/* so instrumentServer()'s monkeypatch lands on the copy the app calls — restores isolation but kills ALL spans, so it is NOT an alternative (build-c.ts, run-b-modeC-items.json): per-request trace ids and correct tags (tag-a/tag-b/tag-c), incoming trace continued ("trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), request data attached — and zero transaction/span envelopes, including zero db spans. Confirms the split: the monkeypatch (packages/remix/src/server/instrumentServer.ts:538, called unconditionally from sdk.ts:38) supplies ONLY isolation + continueTrace + request data (it passes no instrumentTracing option); every span comes from the injected tracing channels in packages/remix/src/server/integrations/tracing-channel.ts, which need @remix-run/server-runtime bundled. Neither side of that split can be had from the other.

3) WORKING combination (build-final2.ts + server-final2.mjs, run-b-modeFinal2-items.json). Two changes on top of the reported Mode B: (a) a 6-line Bun plugin appended after sentryBunPlugin() that pushes 'express' back onto build.config.external, (b) an express middleware in the server entry that re-implements what the un-applied monkeypatch does — Sentry.withIsolationScope(isolationScope => { isolationScope.setSDKProcessingMetadata({ normalizedRequest: {url, method, headers} }); return Sentry.continueTrace({ sentryTrace: req.headers['sentry-trace']||'', baggage: req.headers.baggage||'' }, () => next()); }). Result — db spans AND per-request isolation AND incoming-trace continuation AND route names AND request data:
{"type":"transaction","name":"GET db","op":"http.server","source":"route","trace_id":"0149878f099a46daa34fd2e0a4fd34bd","spans":["function LOADER routes/db","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
{"type":"transaction","name":"GET users/:id","source":"route","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"1111111111111111","spans":["function LOADER routes/users.$id"]}
{"type":"event","exception":"Error: iso-error-a",...,"trace_id":"06b921e317c94214bb7dbb2fe8fa7904","tags":{"probe_tag":"tag-a"},"request":{"url":"http://127.0.0.1:44825/iso/a",...}}
{"type":"event","exception":"Error: iso-error-b",...,"trace_id":"4ca5c59dbc5b4a7d9d01ba2c671daeb0","tags":{"probe_tag":"tag-b"},...}
{"type":"event","exception":"Error: iso-error-c",...,"trace_id":"7807b11daacf46c799066b3581193529","tags":{"probe_tag":"tag-c"},...}
{"type":"event","exception":"Error: probe-loader-boom-7","mechanism":"auto.function.remix.server","handled":false,"trace_id":"5e16a4b26eee4215839c13ba568b83ae","request":{"url":"http://127.0.0.1:44825/boom/7",...}} + {"type":"transaction","name":"GET boom/:id","status":"internal_error","trace_id":"5e16a4b26eee4215839c13ba568b83ae",...}

4) Negative control proving (a) is load-bearing (build-final3-noexternal.ts, same entry, express left for the plugin to bundle+transform): isolation collapses again even with the middleware — one trace "04842bca21db4ea3b9e7a6fc142a9ee8" for all 11 envelopes and {"probe_tag":"tag-c"} on every event. Bundling+transforming express breaks AsyncLocalStorage propagation across next() on Bun.

Reference checked: dev-packages/e2e-tests/test-applications/create-remix-app-express/server.mjs uses exactly the Mode A wiring (import './instrument.mjs' first, createRequestHandler from @remix-run/express), i.e. the repo's own reference app has no Bun bundle step and would produce zero spans on Bun.

Rerun: README-rerun-b.txt in the probe dir. All processes killed; node_modules (294M) left in place for reruns.

## Workaround

Bundle the server with `sentryBunPlugin()` AND (1) append a tiny Bun plugin after it that re-externalizes express — `{ name: 'keep-external', setup(b) { b.config.external = [...(b.config.external ?? []), 'express']; } }` — and (2) add, as the first express middleware, a hand-written replacement for the monkeypatch the bundle defeats: `app.use((req, res, next) => { Sentry.withIsolationScope(scope => { scope.setSDKProcessingMetadata({ normalizedRequest: { url: `${req.protocol}://${req.get('host')}${req.originalUrl}`, method: req.method, headers: req.headers } }); return Sentry.continueTrace({ sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' }, () => next()); }); });`. Files: build-final2.ts and server-final2.mjs in the probe dir. Do not re-externalize `@remix-run/*` instead: that restores isolation natively but removes every span, db spans included.

## Docs impact

A Remix v2 guide for Bun must say: run `bun x remix vite:build` as usual, but the express server entry has to be bundled with `Bun.build({ target: 'bun', plugins: [sentryBunPlugin()] })` or you get no transactions and no database spans at all; because that plugin force-bundles every instrumented package, you must additionally push `express` back onto `build.config.external` from a plugin placed after `sentryBunPlugin()` (bundling express breaks AsyncLocalStorage across `next()` on Bun), and you must add an express middleware that wraps `next()` in `Sentry.withIsolationScope` + `Sentry.continueTrace` and sets `normalizedRequest` on the isolation scope, because Sentry's `createRequestHandler` monkeypatch — the thing that normally provides per-request isolation, trace continuation and request data — patches the `node_modules` copy of `@remix-run/server-runtime` that the bundle no longer uses; without that middleware the whole process shares one trace id, tags leak between concurrent requests, and incoming `sentry-trace` headers are ignored.
