# verify4-M-reactrouter-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans (mysql2) on React Router 8 framework mode, custom Express/node:http server, @sentry/react-router 10.67.0 (develop), bun 1.4.0** of cell `M-reactrouter-bun` (see `$REPRO/cells/M-reactrouter-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-bun-base.log`, `app-bun-dcprobe.log`, `app-bun-dcprobe2.log`, `app-bun-dcprobe3.log`, `app-bun-dcprobe4.log`, `app-bun-debug.log`, `app-bun-rootspan.log`, `app-node.log`, `app-node2.log`, `app.pid`, `run-bunhttp-driver.log`, `run-bunhttp-nokeepalive.log`, `run-driverimport-rootspan.log`, `run-keepalive-norootspan.log`, `run-keepalive-rootspan.log`, `run-nokeepalive-rootspan.log`, `run-soak-keepalive-rootspan.log`, `run-soak30.log`, `run-stream-keepalive-rootspan.log`, `sink.log`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. db spans do work on Bun with @sentry/react-router 10.67.0 once two Bun-specific gaps are closed. Both are real defects, neither is documented, and neither has anything to do with orchestrion injection - the reporter's diagnosis was a false lead (the `orchestrion:mysql2:query`/`:execute` strings they found in `build/server/assets/context-*.js` are just the channel-name constants inside the bundled `@sentry/server-utils` config, not injected publishers; mysql2 3.24.3 is >= 3.20 so the SDK config marks it `registrationOnly` and relies on mysql2's own NATIVE `mysql2:query` / `mysql2:execute` / `mysql2:connect` / `mysql2:pool:connect` diagnostics channels, no code transform involved).

PROBE DIR: $SCRATCH/deep/verify4-M-reactrouter-bun-dbspans/ (app/ = scaffolded `node-custom-server` template, React Router 8 + Express 5 + vite 8; logs `run-*.log`, `app-*.log`).

BASELINE (reproduces the report), `PORT=47312 bun server.js`, no changes:
  <pre id="out">{"rows":[{"id":1,"name":"ada"}],"count":2,"activeSpan":false}</pre>
  sink: only `{"type":"event","message":"sentinel"}` - no transaction, no span envelope, no db span.

FIX (both parts needed), `app/instrument.server.mjs`:
  import * as Sentry from "@sentry/react-router";
  import { bunHttpServerIntegration } from "@sentry/bun";
  Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: "static",
                integrations: [bunHttpServerIntegration()] });
  await import("mysql2/promise");            // Bun: keep the diagnostics channels alive
Then `PORT=47341 bun server.js` (stock `server.js` with `import "./instrument.server.mjs"` as line 1):
  transaction GET /users/:id src=route | ["middleware <anonymous>","db mysql2.pool.connect","db mysql2.connect","db SELECT * FROM users WHERE id = ?","db mysql2.pool.connect","db SELECT name FROM users"]
Stable over a 30s soak, 6 requests spaced 5s apart, every one carried the db spans (run-soak30.log). Also works with `traceLifecycle: 'stream'`:
  span ["db mysql2.pool.connect","db mysql2.connect","db SELECT users","db mysql2.pool.connect","db SELECT users","http.server GET /users/:id","middleware <anonymous>"]

DEFECT A - no root span on Bun for node:http servers. Bun does not publish Node's `http.server.request.start` diagnostics channel, which `@sentry/node`'s `httpServerIntegration` subscribes to (packages/node/src/integrations/http/httpServerIntegration.ts:146). Proof (micro/httpdc.mjs): node prints `DC http.server.request.start FIRED`, bun prints only `status 200`. All db subscribers are registered with `{ requiresParentSpan: true }` (packages/server-utils/src/integrations/mysql2/index.ts:110 and mysql2-dc-subscriber), so with no request span there is no db span either. `@sentry/bun`'s `bunHttpServerIntegration()` exists exactly for this (it patches `http.Server.prototype.emit` and hands the server to the same core instrumentation) but `@sentry/react-router` neither ships nor mentions it. A hand-rolled Express middleware that opens a `forceTransaction` span around `next()` works equally well (`ROOT_SPAN_MIDDLEWARE=1` in app/server.js).

DEFECT B - Bun garbage-collects diagnostics-channel bindings. Bun's `node:diagnostics_channel` holds channels weakly and drops subscribers/bound stores once the caller releases its reference; Node keeps them. Proof (micro/gc.mjs):
  --- node: immediately: dropped= true kept= true sub= true / after gc: dropped= true kept= true sub= true
  --- bun:  immediately: dropped= true kept= true sub= true / after gc: dropped= false kept= true sub= false
The SDK discards the `TracingChannelBindingHandle` returned by `bindTracingChannelToSpan`, so on Bun every channel-based integration silently dies at the first GC. Directly visible with only the SDK loaded (micro/sdkbind.mjs, `Sentry.init` then read `tracingChannel('mysql2:query').start.hasSubscribers`):
  --- node: [sync] true ... [after 50ms] mysql2:query start.hasSubscribers= true
  --- bun:  [sync] true ... [after 50ms] mysql2:query start.hasSubscribers= false
Consequence inside the app: with the root span present but nothing holding the channels, mysql2's own `shouldTrace()` gate reads `channel.hasSubscribers ?? channel.start?.hasSubscribers` (undefined on Bun, then false) and never publishes:
  [route] dcState {"startHasSubscribers":false}          <- inside the RR server bundle, bun
  [route] dcState {"hasSubscribers":true,"startHasSubscribers":true}   <- same build, node
  sink, bun, root span but no keepalive: transaction GET /users/:id | ["middleware <anonymous>"]
  sink, bun, root span + keepalive:      transaction GET /users/:id | [... ,"db SELECT * FROM users WHERE id = ?", ...]
Any strong reference fixes it: `await import("mysql2/promise")` in the instrument file (mysql2 caches the channels at module scope), or `globalThis.x = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(tracingChannel)`. Both were measured working after a 12s soak.

CONTROL - the exact same `react-router build` output under node (`PORT=47317 node server.js`, no workarounds) emits db spans out of the box:
  transaction GET /users/:id | ["middleware compression","middleware logger","middleware serveStatic","middleware mounted_app","middleware <anonymous>","db mysql2.pool.connect","db mysql2.connect","db SELECT * FROM users WHERE id = ?","db mysql2.pool.connect","db SELECT name FROM users"]
So the Vite/`sentryReactRouter` build is fine; only the Bun runtime path is broken.

Confirmed side notes: the reporter's `entry.server.tsx` rewrite to `renderToReadableStream` + `Sentry.wrapSentryHandleRequest` is indeed required on Bun (`react-dom/server` resolves to `server.bun.js`, no `renderToPipeableStream`), and `ssr.noExternal: ["mysql2"]` is unnecessary - `sentryOrchestrionPlugin`'s own `config` hook already force-bundles every instrumented module.

NOT RUN: the CI pin bun 1.3.14 - `$SCRATCH/bun1314/` does not exist on this machine (only `deep`, `pack`, `qs` and three html files are under `$S`). All results are bun 1.4.0 and node v26.5.0.

Reproduce: `cd .../verify4-M-reactrouter-bun-dbspans/app && npm install && npm install $REPRO/_toolbox/pack/sentry-{react-router,node,core,browser,react,server-utils,server-runtime-injection,opentelemetry,bundler-plugins,browser-utils,replay,replay-canvas,feedback,bun}-10.67.0.tgz mysql2 && npx react-router build`, start `PORT=47311 node $REPRO/_toolbox/sink.mjs`, then `PORT=<port> BUN_HTTP=1 KEEPALIVE=driver SENTRY_TUNNEL=http://127.0.0.1:47311/ bun server.js`. `app/micro/{httpdc,gc,sdkbind,tcid,bindstore}.mjs` are the standalone one-file proofs of each mechanism.

## Workaround

In `instrument.server.mjs`, add `integrations: [bunHttpServerIntegration()]` from `@sentry/bun` to the `@sentry/react-router` `Sentry.init()` call (Bun never publishes Node's `http.server.request.start` channel, so without it there is no request span and db spans are suppressed by `requiresParentSpan`), and immediately after `Sentry.init()` add `await import("mysql2/promise")` so a module-scope reference keeps the mysql2 diagnostics channels alive against Bun's weak channel registry. Both are needed; either alone yields zero db spans. Equivalent alternatives: a `forceTransaction` Express middleware instead of `bunHttpServerIntegration()`, and `globalThis.__keep = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(n => tracingChannel(n))` instead of the driver import.

## Docs impact

On Bun, the React Router server SDK needs two extra lines in the instrumentation file: add `bunHttpServerIntegration()` from `@sentry/bun` to `Sentry.init()` (Bun does not emit the `http.server.request.start` diagnostics channel, so without it no request span is created and database, cache and other child spans are dropped), and import your database driver (for example `await import("mysql2/promise")`) right after `Sentry.init()` so its diagnostics channels are not garbage-collected by Bun's weak channel registry.
