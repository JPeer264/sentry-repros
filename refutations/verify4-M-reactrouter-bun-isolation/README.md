# verify4-M-reactrouter-bun-isolation

## What it re-tests

Independent re-test of the capability **isolation** of cell `M-reactrouter-bun` (see `$REPRO/cells/M-reactrouter-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-bun1314.log`, `app-bunhttp-stream.log`, `app-bunhttp.log`, `app-err.log`, `app-manual.log`, `app-manual2.log`, `app-node.log`, `app-stock.log`, `app.pid`, `build1.log`, `build2.log`, `drive-bun1314.out`, `drive-bunhttp-stream.out`, `drive-bunhttp.out`, `drive-err.out`, `drive-manual.out`, `drive-manual2.out`, `drive-node.out`, `drive-stock.out`, `drive.mjs`, `npm-base.log`, `npm-sentry.log`, `run2/`, `scaffold.log`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The leak is real with the reported wiring, but it is a one-line fix, and the SDK already ships the integration that fixes it.

ROOT CAUSE (proved directly, not theorised): the Node SDK's per-request isolation scope is forked by the subscriber to the Node **core** diagnostics channel `http.server.request.start` (packages/core/src/integrations/http/server-subscription.ts:132-175 `getIsolationScope().clone()` … `withIsolationScope(...)`, subscribed in packages/node/src/integrations/http/httpServerIntegration.ts:146). This channel is published by Node itself, not by the orchestrion/`--import` injection, so the "no diagnostics-channel injection" warning is a red herring here. Bun simply never publishes it. Direct probe ($S/deep/verify4-M-reactrouter-bun-isolation/run2/dc.mjs, subscribe + one request to a `node:http` server):
  bun 1.4.0 -> {"runtime":"bun","seen":[]}
  node v26.5.0 -> {"runtime":"node","seen":["http.server.request.start","http.server.response.finish"]}
`@sentry/react-router` never forks an isolation scope itself (wrapSentryHandleRequest and createSentryServerInstrumentation only rename the root span), so with no channel there is no request boundary at all.

BASELINE (reproduced, bun 1.4.0, traceLifecycle 'static', three concurrent /users/:id?mode=isolation with delays 300/150/50 plus a sentinel) — run2/drive-A.out + sink:
  {"tag":"alpha", "loader":{"tag":"alpha","isolationTagAfterWait":"bravo","traceId":"047d9e55bdbc455f9dbc2f1a4e596f44"}}
  {"tag":"bravo", "loader":{"tag":"bravo","isolationTagAfterWait":"bravo","traceId":"047d9e55bdbc455f9dbc2f1a4e596f44"}}
  {"tag":"charlie","loader":{"tag":"charlie","isolationTagAfterWait":"bravo","traceId":"047d9e55bdbc455f9dbc2f1a4e596f44"}}
  {"type":"event","exception":"isolation probe charlie","tags":{"probe_tag":"bravo"},"user":{"id":"user-bravo"},"trace_id":"047d9e55bdbc455f9dbc2f1a4e596f44"}
  {"type":"event","exception":"isolation probe alpha","tags":{"probe_tag":"bravo"},"user":{"id":"user-bravo"},"trace_id":"047d9e55bdbc455f9dbc2f1a4e596f44"}
  {"type":"event","message":"sentinel","tags":{"probe_tag":"bravo"},"user":{"id":"user-bravo"},"trace_id":"047d9e55bdbc455f9dbc2f1a4e596f44"}
(last writer wins, one process-lifetime trace — matches the report; the winning tag is just race-dependent.)

FIX (run2/drive-B.out, traceLifecycle 'static'): each request gets its own isolation scope, its own tag/user, its own trace id, AND a route-named `http.server` transaction:
  {"type":"event","exception":"isolation probe charlie","tags":{"probe_tag":"charlie"},"user":{"id":"user-charlie","ip_address":"::ffff:127.0.0.1"},"transaction":"GET /users/3","trace_id":"6eb5d85d678c4ee9a325e6f165090b89"}
  {"type":"event","exception":"isolation probe bravo","tags":{"probe_tag":"bravo"},"user":{"id":"user-bravo",...},"transaction":"GET /users/2","trace_id":"f2adafbe160d488c93e8519d756825f2"}
  {"type":"event","exception":"isolation probe alpha","tags":{"probe_tag":"alpha"},"user":{"id":"user-alpha",...},"transaction":"GET /users/1","trace_id":"8391582d09234f919951cf44c74d4200"}
  {"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","route":"/users/:id","tags":{"probe_tag":"alpha"},"trace_id":"8391582d09234f919951cf44c74d4200","spans":["middleware <anonymous>"]}
  {"type":"event","message":"sentinel","tags":{"runtime":"node"},"transaction":"GET /flush","trace_id":"3d48ec63ebd64a07ac6c391b87f21eb9"}   <- no leaked probe_tag
Four distinct trace ids, no cross-request tag/user bleed.

Same result on the default `traceLifecycle: 'stream'` (run2/drive-C.out): three distinct trace ids, per-request tags, and `span` envelopes "http.server GET /users/:id trace=<per-request id>". So this also refutes the "records NO spans of any kind" line in the setup summary: the missing http server instrumentation was the cause of both.

SECOND, DEPENDENCY-FREE WORKAROUND (run2/drive-D.out): an Express middleware `app.use((req,res,next) => Sentry.withIsolationScope(() => { Sentry.getCurrentScope().setPropagationContext({ traceId: crypto.randomUUID().replace(/-/g,''), sampleRand: Math.random() }); next(); }))` also isolates correctly (per-request tags, distinct trace ids), proving AsyncLocalStorage itself is healthy on Bun. But it yields no transactions, no route names and no request data, so it is strictly worse than the integration.

Prior art in this repo: dev-packages/e2e-tests/test-applications/nextjs-16-bun/sentry.server.config.ts:1,16 already does exactly this (`bunHttpServerIntegration({ spans: false })`) for the same reason. There is no react-router-on-Bun e2e app, so nothing carried the pattern over. The integration's own JSDoc (packages/bun/src/integrations/bunHttpServer.ts:86-101) describes this precise failure mode.

NOT CROSS-CHECKED: the CI-pinned bun 1.3.14 at $S/bun1314 no longer exists on disk (directory removed), so only bun 1.4.0 was exercised this run.

Rerun: probe files in $SCRATCH/deep/verify4-M-reactrouter-bun-isolation/ (app/ has node_modules and build/ intact).
  PORT=47311 node ../sink.mjs &
  (cd app && SINK_PORT=47311 PORT=47312 PROBE_VARIANT=stock    PROBE_LIFECYCLE=static bun server.js &)   # broken
  (cd app && SINK_PORT=47311 PORT=47313 PROBE_VARIANT=bunhttp  PROBE_LIFECYCLE=static bun server.js &)   # fixed
  (cd app && SINK_PORT=47311 PORT=47315 PROBE_VARIANT=manualiso PROBE_LIFECYCLE=static bun server.js &)  # fixed, no spans
  APP_PORT=<port> node run2/drive.mjs ; curl -s http://127.0.0.1:47311/__items
Key files: app/instrument.server.mjs (variant switch), app/server.js (manualiso middleware), app/app/routes/users.tsx (probe loader), run2/dc.mjs (channel probe), run2/drive.mjs, run2/drive-A.out … drive-D.out.

## Workaround

Install `@sentry/bun` alongside `@sentry/react-router` and add its `bunHttpServerIntegration()` to the server-side `Sentry.init`, in `instrument.server.mjs`:

  import * as Sentry from '@sentry/react-router';
  import { bunHttpServerIntegration } from '@sentry/bun';

  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    integrations: [bunHttpServerIntegration()],
  });

Nothing else changes: same `server.js`, same `wrapSentryHandleRequest` entry, works with both `traceLifecycle: 'static'` and the default `'stream'`. It patches `http.Server.prototype.emit` and hands each server to the same core instrumentation the Node SDK gets from the `http.server.request.start` channel, so it restores per-request isolation scopes, per-request trace ids, request data on events, and route-named `http.server` transactions in one step. Pass `{ spans: false }` only when another layer already emits incoming-request spans (as nextjs-16-bun does); for a custom Express/React Router server leave spans on. If adding a second SDK package is unacceptable, an Express middleware wrapping `next()` in `Sentry.withIsolationScope` plus a fresh `setPropagationContext` isolates tags and traces too, but produces no transactions, route names or request data.

## Docs impact

On Bun, `node:http` never emits the `http.server.request.start` diagnostics channel that the Node-based SDKs use to isolate each incoming request, so any Bun server built on `node:http` (Express, React Router framework mode with a custom server, Next.js) must add `bunHttpServerIntegration()` from `@sentry/bun` to `Sentry.init` — without it every request shares one isolation scope and one trace, so `setTag`/`setUser` from one request leak into every other request's events, and no `http.server` spans are recorded.
