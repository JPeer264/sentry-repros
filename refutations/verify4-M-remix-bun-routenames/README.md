# verify4-M-remix-bun-routenames

## What it re-tests

Independent re-test of the capability **route names (Remix v2 + @sentry/remix 10.67.0 on Bun 1.4.0)** of cell `M-remix-bun` (see `$REPRO/cells/M-remix-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `README-rerun.txt`, `app/`, `build-server.ts`, `db.server.mjs`, `drive-iso.mjs`, `drive-trace.mjs`, `drive.mjs`, `drive.sh`, `instrument-a.mjs`, `instrument-c.mjs`, `instrument-e.mjs`, `modeA.log`, `modeA.pid`, `modeB-stream.log`, `modeB.log`, `modeB.pid`, `modeBs.pid`, `modeC-stream.log`, `modeC.log`, `modeC.pid`, `modeCs.pid`, `node-control.log`, `node.pid`, `package-lock.json`, `package.json`, `pid-a.txt`, `pid-a2.txt`, `pid-ad.txt`, `pid-b.txt`, `pid-b2.txt`, `pid-b3.txt`, `pid-c.txt`, `pid-c2.txt`, `pid-c3.txt`, `pid-d.txt`, `pid-e.txt`, `pid-es.txt`, `pid-node.txt`, `run-a-debug.log`, `run-a.log`, `run-a2.log`, `run-b.log`, `run-b2.log`, `run-b3.log`, `run-c.log`, `run-c2.log`, `run-c3.log`, `run-d.log`, `run-e-stream.log`, `run-e.log`, `run-node.log`, `server-a.mjs`, `server-c.mjs`, `server-d.mjs`, `server-e.mjs`, `sink.log`, `sink.mjs`, `sink.pid`, `sinkpid.txt`, `tsconfig.json`, `vite.config.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Rebuilt the probe from scratch (the earlier $REPRO/cells/M-remix-bun/ dir no longer exists) in $REPRO/refutations/verify4-M-remix-bun-routenames/app: Remix 2.17.4 vite plugin + @remix-run/express, `bun x remix vite:build` (works unmodified on Bun), @sentry/remix 10.67.0 from the develop tarballs, `import './instrument.mjs'` first line of server.mjs, `export const handleError = Sentry.sentryHandleError`, sink on 34177, app on 34199, sentinel-gated driver.

MODE A (`bun server.mjs`) — the prior report's "zero envelopes" is CONFIRMED, and it is not route-name specific: the whole tracing pipeline is absent.
  {"type":"event","exception":"Error: probe-loader-boom-7","mechanism":"auto.function.remix.server","handled":false,"sdk":"sentry.javascript.remix","trace_id":"89e72131d5a144efa08751b91f5281ba","request":{"url":"http://127.0.0.1:34199/boom/7",...}}
  {"type":"event","exception":"Error: iso-error-a",...,"trace_id":"9752cb27...","tags":{"probe_tag":"tag-a"}}
  {"type":"event","exception":"Error: iso-error-b",...,"trace_id":"fb2fc9ee...","tags":{"probe_tag":"tag-b"}}
  -> five events, zero transaction and zero span envelopes. Note the events also carry NO `transaction` field, so the route is missing from error grouping too. Root cause is in the SDK, not just in Bun: `init()` calls `instrumentServer()` with no options (packages/remix/src/server/sdk.ts:37), so `makeWrappedCreateRequestHandler`'s whole span branch is gated off by `if (options?.instrumentTracing)` (instrumentServer.ts:336, 359, 397) — the monkeypatch only ever does `withIsolationScope` + `continueTrace`. On develop the Remix server span comes exclusively from the orchestrion channel `orchestrion:@remix-run/server-runtime:requestHandler` (packages/remix/src/server/integrations/tracing-channel.ts:135), and the route name from the `matchServerRoutes` channel (tracing-channel.ts:114 `enrichActiveSpanWithRoute` -> `span.updateName(`${method} ${route.path}`)` + source `route`). Orchestrion on Bun is build-time only (packages/server-utils/src/orchestrion/bundler/bun.ts header comment), so no bundle = no span = no name. Nothing in Mode A can be configured to produce a route name; `Sentry.instrumentBuild` only wraps loaders/actions/documentRequest, it never opens a server span.

MODE B (`bun build-server.ts && bun dist/server.js`, Bun.build + sentryBunPlugin()) — route names WORK, exactly as reported, traceLifecycle 'static':
  {"type":"transaction","name":"GET users/:id","op":"http.server","source":"route","status":"ok","spans":["function LOADER routes/users.$id"]}
  {"type":"transaction","name":"GET posts/:postId/comments/:commentId","op":"http.server","source":"route","status":"ok","spans":["function LOADER routes/posts.$postId.comments.$commentId"]}
  {"type":"transaction","name":"GET boom/:id","op":"http.server","source":"route","status":"internal_error","spans":["function LOADER routes/boom.$id"]}

NEW: route names also work under the DEFAULT traceLifecycle 'stream' (the prior probe only tested 'static'), low-cardinality and marked as the segment:
  {"type":"span","items":["function LOADER routes/users.$id","http.server GET users/:id",...],"raw":[{"name":"GET users/:id","status":"ok","is_segment":true,"origin":"auto.http.remix"},{"name":"GET posts/:postId/comments/:commentId","is_segment":true},{"name":"GET boom/:id","status":"error","is_segment":true}]}

NEW / the actual refutation: the "spans or isolation, not both" trade-off is NOT intrinsic. Keeping the bundle and adding ten lines at the express layer (app/server-iso.mjs) restores per-request isolation, incoming-trace continuation and request data while every route name survives — Mode C, `bun build-server-iso.ts && bun dist-iso/server-iso.js`:
  app.all('*', (req, res, next) => Sentry.withIsolationScope(isolationScope => { isolationScope.setSDKProcessingMetadata({ normalizedRequest: {...} }); return Sentry.continueTrace({ sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' }, () => remixHandler(req, res, next)); }));
  {"type":"transaction","name":"GET users/:id","op":"http.server","source":"route","status":"ok","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"1111111111111111","spans":["function LOADER routes/users.$id"]}   <- incoming sentry-trace continued
  {"type":"event","exception":"Error: iso-error-a",...,"trace_id":"83b025802dd7402787b5cd45b5a3551e","tags":{"probe_tag":"tag-a"},"request":{"url":".../iso/a",...}}
  {"type":"event","exception":"Error: iso-error-b",...,"trace_id":"e73bf17d20cf48f69249cb28f1e96cde","tags":{"probe_tag":"tag-b"},...}
  {"type":"event","exception":"Error: iso-error-c",...,"trace_id":"b291a7faadf144e89252c58a9531f1f1","tags":{"probe_tag":"tag-c"},...}
  {"type":"transaction","name":"GET iso/:id",...,"trace_id":"83b025802dd7402787b5cd45b5a3551e"} / "e73bf17d..." / "b291a7fa..."   <- three distinct traces
  (Mode B for contrast had one process-wide trace_id ea93f40e24054ba686718c7189b3092c on every item and "probe_tag":"tag-b" on all three iso errors — reproduced, so that half of the prior report stands for the unmodified Mode B.)
  Mode C behaves the same under traceLifecycle 'stream': {"type":"span","trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","raw":[{"name":"GET users/:id","parent_span_id":"1111111111111111","is_segment":true}]} plus one distinct trace_id per concurrent /iso request.

NODE CONTROL (same unbundled app, `node --import ./node_modules/@sentry/remix/build/import-hook.mjs server.mjs`) — Bun Mode B/C route names are byte-identical to Node:
  {"type":"transaction","name":"GET users/:id","op":"http.server","source":"route","spans":["function LOADER root","function LOADER routes/users.$id"]}
  {"type":"transaction","name":"GET posts/:postId/comments/:commentId","source":"route",...}
  {"type":"transaction","name":"GET users/:id",...,"trace_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","parent_span_id":"1111111111111111"}
  Node keeps two extras Bun does not: the `LOADER root` span (from `instrumentBuild`'s monkeypatch, which only lands because @remix-run/server-runtime is not bundled there) and `"transaction":"GET /boom/7"` + `user.ip_address` on error events (from @sentry/node's http server isolation).

So for the route-names capability specifically there is a run shape on Bun that gets it fully right, in both trace lifecycles, with parameterized and multi-segment routes and source `route`. Mode A produces nothing because Bun has no runtime instrumentation at all without a bundle (the established Bun rule for every library), not because of anything Remix-specific, and the isolation loss that made the prior verdict "partial" is removable without giving up the bundle.

Probe files: $REPRO/refutations/verify4-M-remix-bun-routenames/ (README-rerun.txt has the exact commands; app/server.mjs, app/server-iso.mjs, app/build-server.ts, app/build-server-iso.ts, drive.sh, modeA.log, modeB.log, modeB-stream.log, modeC.log, modeC-stream.log, node-control.log). All processes started were killed.

## Workaround

Bundle the server with Bun.build + sentryBunPlugin() and run the bundle — `bun build-server.ts && NODE_ENV=production bun dist/server.js` — never `bun server.mjs`. That alone gives correct route names (`GET users/:id`, source `route`, `LOADER routes/users.$id` children) under both traceLifecycle 'static' and 'stream'. To also get back the per-request isolation and incoming-trace continuation that the bundle costs you, wrap the Remix express handler yourself in the entry that gets bundled:

  const remixHandler = createRequestHandler({ build: await import('./build/server/index.js') });
  app.all('*', (req, res, next) =>
    Sentry.withIsolationScope(isolationScope => {
      isolationScope.setSDKProcessingMetadata({
        normalizedRequest: { url: `${req.protocol}://${req.get('host')}${req.originalUrl}`, method: req.method, headers: req.headers },
      });
      return Sentry.continueTrace(
        { sentryTrace: req.headers['sentry-trace'] || '', baggage: req.headers.baggage || '' },
        () => remixHandler(req, res, next),
      );
    }),
  );

Verified end to end (app/server-iso.mjs): distinct trace ids and tags per concurrent request, incoming sentry-trace continued as parent_span_id, request data on error events, and every route name unchanged.

## Docs impact

A Bun guide for Remix v2 must say: `bun server.mjs` gives you errors and logs but no transactions or spans at all, because Sentry's library instrumentation on Bun is build-time only — to get route-named `http.server` transactions (`GET users/:id`) and `LOADER` spans you must bundle the server entry with `Bun.build({ target: 'bun', plugins: [sentryBunPlugin()] })` and run the bundle; and because bundling makes Remix's own `createRequestHandler` patch miss, add a `Sentry.withIsolationScope` + `Sentry.continueTrace` wrapper around the Remix express handler in that entry, otherwise every request shares one trace and scope data leaks between requests.
