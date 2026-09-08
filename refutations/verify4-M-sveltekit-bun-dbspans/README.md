# verify4-M-sveltekit-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans (mysql2) in SvelteKit 2.70 + @sentry/sveltekit 10.67.0 (develop) on bun 1.4.0, adapter-node output** of cell `M-sveltekit-bun` (see `$REPRO/cells/M-sveltekit-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `RERUN.md`, `app/`, `app-bun-1.log`, `app-bun-nopin-static.log`, `app-bun-pinned.log`, `app-bun-static.log`, `app-node-1.log`, `app.pid`, `app2.pid`, `app3.pid`, `app4.pid`, `appn.pid`, `dctest.mjs`, `gctest.mjs`, `gctest2.mjs`, `micro/`, `min/`, `pid-b`, `pid-base`, `run-base-bun.log`, `run-base-stream-bun.log`, `run-variantB-bun.log`, `run-variantB-stream-bun.log`, `sink.log`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

Reproduced the reported failure, then made db spans appear on bun with a one-line app change. The reported diagnosis (missed `waitForTracingChannelBinding` retry window) is WRONG: the SDK does subscribe, and then bun garbage-collects the subscription.

Probe dir: $SCRATCH/deep/verify4-M-sveltekit-bun-dbspans (app/ = SvelteKit app, micro/ = no-framework isolators, RERUN.md = exact commands). Sink: `PORT=41777 node $REPRO/_toolbox/sink.mjs`. Build/run: `cd app && npx vite build && PORT=<port> SENTRY_TUNNEL=http://127.0.0.1:41777/ bun build/index.js`, drive with `curl /api/db`.

A/B on ONE build config (default traceLifecycle 'stream'), only `app/src/instrumentation.server.ts` differs.

A. Documented wiring (Sentry.init only) — BROKEN, matches the report:
  curl /api/db -> {"rows":[{"id":1,"name":"ada"},{"id":2,"name":"linus"}],"subs":false}
  {"type":"span","items":["function sveltekit.resolve","http.server GET /api/db"]}

B. Same file with `import 'mysql2/promise';` added (position in the file is irrelevant — the import evaluates before the `Sentry.init()` call either way) — WORKS:
  curl /api/db -> {...,"subs":true}
  {"type":"span","items":["db mysql2.pool.connect","db mysql2.connect","db SELECT users","function sveltekit.resolve","http.server GET /api/db"]}
  With traceLifecycle:'static' the same change gives:
  {"type":"transaction","name":"GET /api/db","op":"http.server","source":"route","spans":["function sveltekit.resolve","db mysql2.pool.connect","db mysql2.connect","db SELECT * FROM users"]}

Root cause (isolated without SvelteKit, Vite or any bundler, in micro/ with plain `@sentry/node` + mysql2 3.24.3 under `bun app.mjs`):
  bun: "after init, mysql2:query hasSubscribers = true" then "at query time, mysql2:query hasSubscribers = false" -> only ["test probe-root"] in the sink.
  node (same file): true / true -> ["db mysql2.pool.connect","db mysql2.connect","db SELECT users","test probe-root"].
  The SDK debug log on bun shows the subscription DID happen: "Sentry Logger [log]: [instrumentation:mysql2] Bun/Deno, subscribing eagerly" / "[instrumentation:mysql2] subscribing to channels". So the async-context binding was present at init; nothing was missed.
  micro/dc-gc.mjs (pure runtime test, no Sentry): subscribe to `dc.tracingChannel('probe:chan')` without retaining the object -> bun "immediately: true", "after gc: false"; node "after gc: true". Retaining the channel object keeps the subscribers alive on bun (dc-gc2.mjs). i.e. bun holds diagnostics_channel channels weakly and drops their subscribers once the channel object is unreachable; Node keeps a subscribed channel alive.
  Sequence in the failing case: Sentry subscribes to `mysql2:query`/`:execute`/`:connect`/`:pool:connect` at `Sentry.init()`, before mysql2 is loaded, and keeps no reference to those channels (`subscribeMysql2DiagnosticChannels` in packages/server-utils/src/integrations/mysql2/mysql2-dc-subscriber.ts subscribes and drops the wrapper). bun collects them; mysql2 then loads and creates fresh, subscriber-less channels of the same names. Loading mysql2 first (or pinning the channels) keeps the object alive so Sentry's subscription survives — that is exactly why the workaround works, and why plain bundled Bun apps where the driver is already in the graph do get db spans.
  This is not mysql2-specific: every diagnostics-channel integration that subscribes at `init()` before its module loads is exposed on bun.

Three fixes verified on bun (micro/app-b.mjs, app-c.mjs, app-d.mjs — all produce ["db mysql2.pool.connect","db mysql2.connect","db SELECT users", ...]):
  - `import 'mysql2/promise'` in the same file as `Sentry.init()` (before or after the Sentry import),
  - creating the pool in that file,
  - user-side pinning: `globalThis.__keep = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(n => require('node:diagnostics_channel').tracingChannel(n))`.
SDK-side fix (not applied, repo untouched): retain a module-level strong reference to every channel the SDK subscribes to.

Two setup facts from the original report reproduce and still hold: the Vite plugin is `@sentry/sveltekit/vite` on develop, and `experimental.instrumentation.server: true` + `src/instrumentation.server.ts` is required or no span/transaction envelopes are emitted at all.

Processes started (sink 41777, bun servers on 43117/52341/52987/53829) were all killed; micro/node_modules removed.

## Workaround

In `src/instrumentation.server.ts`, import the database driver in the same file as `Sentry.init()` — `import 'mysql2/promise';` next to `import * as Sentry from '@sentry/sveltekit';` (order within the file does not matter). That keeps the `mysql2:*` diagnostics channels reachable so bun cannot garbage-collect Sentry's subscription before mysql2 loads. Creating the pool in that file works equally well. Generic form for any channel-based integration on bun: hold a strong reference to the channels, e.g. `globalThis.__sentryKeepChannels = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect'].map(n => tracingChannel(n))` from `node:diagnostics_channel`.

## Docs impact

On Bun, import your database driver (or create the connection/pool) inside `src/instrumentation.server.ts`, in the same file as `Sentry.init()` — Bun drops `node:diagnostics_channel` subscriptions whose channel object is unreachable, so a driver that first loads after `Sentry.init()` publishes to fresh, unsubscribed channels and produces no `db` spans.
