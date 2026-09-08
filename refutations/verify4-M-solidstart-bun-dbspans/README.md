# verify4-M-solidstart-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans (SolidStart 2 + nitro 3 node output, run with `bun .output/server/index.mjs`, develop SDK 10.67.0)** of cell `M-solidstart-bun` (see `$REPRO/cells/M-solidstart-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `appbun.pid`, `appnode.pid`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `build7.log`, `dctest.mjs`, `dctest3.mjs`, `gctest.mjs`, `gctest2.mjs`, `install-mysql1.log`, `install.log`, `pin.mjs`, `run-bun-eager-stream.log`, `run-bun-eagerimport.log`, `run-bun-mysql1.log`, `run-bun-nopin.log`, `run-bun-pin.log`, `run-bun-sdkpatch.log`, `run-bun-unpatched.log`, `run-bun1.log`, `run-bun2.log`, `run-node-mysql1.log`, `run-node.log`, `sink-v.log`, `sink-v.pid`, `sink.log`, `sink.pid`, `tracing-channel.orig.js`, `vapp.pid`, `vbuild-final.log`, `vbuild-pin.log`, `vbuild-pin2.log`, `vbuild-sdkpatch.log`, `vrun-a-bun-baseline.log`, `vrun-b-bun-preloadpin.log`, `vrun-c-bun-inapp-pin.log`, `vrun-d-bun-nopin-samebuild.log`, `vrun-e-bun-pin-static-both.log`, `vrun-f-bun-pin-stream.log`, `vrun-g-bun-sdkretain-nopin.log`, `vrun-h-final-nopin.log`, `vrun-i-final-pin.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. db spans work on bun with the documented SolidStart 2 wiring plus a 5-line pin in the app. The original diagnosis is wrong on both counts: build-time injection DOES happen, and no Bun-plugin build step is needed.

Probe dir: $SCRATCH/deep/verify4-M-solidstart-bun-dbspans/ (app/ is the docs-shaped SolidStart 2 app; the vite.config.ts matches ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/solidstart-2/vite.config.ts one-for-one).

=== 1. The exact change (app-side, no SDK patch) ===
In app/server/plugins/sentry.ts, right after Sentry.init():

  import dc from 'node:diagnostics_channel';
  (globalThis as Record<string, unknown>).__sentryPinnedChannels = [
    'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
    'orchestrion:mysql:query', 'orchestrion:mysql2:query', 'orchestrion:mysql2:execute',
  ].map(name => dc.tracingChannel(name));

A/B on the IDENTICAL build (`npx vite build`, then `PORT=<p> SENTRY_TUNNEL=http://127.0.0.1:45123/ SENTRY_LIFECYCLE=static [PIN_CHANNELS=1] bun .output/server/index.mjs`), sink lines verbatim:

  --- NO PIN (vrun-h-final-nopin.log):
  {"n":"GET /api/db","spans":["middleware GET /api/db","http.server GET /api/db"]}
  --- PIN (vrun-i-final-pin.log):
  {"n":"GET /api/db","spans":["middleware GET /api/db","http.server GET /api/db","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}

Same for the `mysql` (v2.x) driver, which needs orchestrion build-time injection rather than mysql2's own channels (vrun-e-bun-pin-static-both.log):
  {"type":"transaction","name":"GET /api/db-mysql1","spans":["middleware GET /api/db-mysql1","http.server GET /api/db-mysql1","db SELECT id, name FROM users"]}

Works on both lifecycles. traceLifecycle 'stream' with the pin (vrun-f-bun-pin-stream.log):
  {"t":"span","items":["middleware GET /api/db","db mysql2.pool.connect","db mysql2.connect","db SELECT users","http.server GET","http.server GET","middleware GET /api/sentinel"]}

=== 2. Root cause: bun drops diagnostics_channel subscriptions on GC ===
Not an injection problem. deep/verify4-M-solidstart-bun-dbspans/dctest3.mjs subscribes three ways without keeping a reference to the channel object, forces GC, then publishes:

  $ bun dctest3.mjs   -> {"runtime":"bun","plainSubscribe":0,"channelSubscribe":0,"tracing":0}
  $ node --expose-gc dctest3.mjs -> {"runtime":"node","plainSubscribe":1,"channelSubscribe":1,"tracing":1}

bun 1.4.0 collects a channel that still has subscribers when nothing else holds it; node keeps subscribed channels alive. The SDK subscribes eagerly on Bun (packages/server-utils/src/orchestrion/instrumentation.ts: "Bun and Deno have no such channel limit ... there we just subscribe immediately") and then discards the channel: subscribeMysql2DiagnosticChannels -> bindTracingChannelToSpan(tracingChannel(name), ...) throws away the returned handle (packages/server-utils/src/integrations/mysql2/mysql2-dc-subscriber.ts:93-126, packages/server-utils/src/tracing-channel.ts:120,200). Between the nitro plugin's Sentry.init() and the first request bun GCs, so the subscription is gone before mysql2 publishes. This is generic: every channel-based integration on bun is exposed, not just db.

=== 3. The SDK-side one-liner also fixes it, with zero app changes ===
Patched node_modules/@sentry/server-utils/build/esm/tracing-channel.js to retain what it subscribes to (`const __SENTRY_RETAINED_CHANNELS__ = []` + `__SENTRY_RETAINED_CHANNELS__.push(handle.channel, channel)` after `handle.channel.subscribe(subscribers)`), rebuilt, ran WITHOUT the app pin (vrun-g-bun-sdkretain-nopin.log):
  {"t":"transaction","n":"GET /api/db","spans":["middleware GET /api/db","http.server GET /api/db","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users"]}
  {"t":"transaction","n":"GET /api/db-mysql1","spans":["middleware GET /api/db-mysql1","http.server GET /api/db-mysql1","db SELECT id, name FROM users"]}
The patch was reverted afterwards (original kept at tracing-channel.orig.js) and the final .output is the unpatched baseline, so a re-run reproduces the broken/fixed A/B above.

=== 4. What the original report got wrong ===
- "mysql2 is externalized by nitro, so build-time injection never sees it" — false. The stock build bundles and transforms it: .output/server/_ssr/promise-4o3jIiz1.mjs contains `dc.tracingChannel("mysql2:query")` (x5 channels) and `globalThis.__SENTRY_ORCHESTRION_INJECT__ = orchestrionModuleInjected("mysql2", mysql2Integration)`. The `mysql` v2 driver chunk .output/server/_ssr/db-mysql1-*.mjs contains `orchestrion:mysql:query`. No `ssr.noExternal` needed.
- "[Sentry] Bundler plugin ran, injected libraries=[]" is a red herring: mysql2 >= 3.20 is a `registrationOnly` orchestrion entry (packages/server-utils/src/orchestrion/config/mysql2.ts) and publishes its own channels, so an empty list says nothing about whether db spans can work.
- "No available Node API to register diagnostics-channel injection hooks" is irrelevant here — the runtime hook is only a second path to injection, and the bundler already did the job.

=== 5. Not tested ===
bun 1.3.14 (the CI pin at $SCRATCH/bun1314 no longer exists on disk), so I cannot say whether this is a bun 1.4.0 regression.

Commands to rerun: `PORT=45123 node $REPRO/_toolbox/sink.mjs &`; `cd app && npx vite build`; `PORT=45131 SENTRY_TUNNEL=http://127.0.0.1:45123/ SENTRY_LIFECYCLE=static bun .output/server/index.mjs` (no db spans) vs the same with `PIN_CHANNELS=1` (db spans); `curl http://127.0.0.1:45123/__items`.

## Workaround

Hold a strong reference to the diagnostics channels after Sentry.init() in server/plugins/sentry.ts, so bun's GC cannot unsubscribe the SDK: `import dc from 'node:diagnostics_channel'; globalThis.__sentryPinnedChannels = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(n => dc.tracingChannel(n));` (add 'orchestrion:mysql:query' for the `mysql` v2 driver, and the matching 'orchestrion:<lib>:<event>' names for other instrumented libraries). Works identically as a `bun --preload pin.mjs .output/server/index.mjs` file if you cannot touch the nitro plugin. The proper fix belongs in the SDK: `bindTracingChannelToSpan` must retain the channel it subscribes to (verified to work).

## Docs impact

On Bun, database and other library spans need an extra step: Bun garbage-collects `diagnostics_channel` channels that still have subscribers, which silently unsubscribes Sentry's instrumentation, so keep a reference to the channels alive next to your `Sentry.init()` — `import dc from 'node:diagnostics_channel'; globalThis.__sentryPinnedChannels = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(n => dc.tracingChannel(n));` — after which SolidStart 2's `sentrySolidStart()` vite plugin produces the same `db` spans on Bun as on Node; no Bun-specific build step is required.
