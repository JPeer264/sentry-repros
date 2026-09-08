# verify4-M-astro-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans** of cell `M-astro-bun` (see `$REPRO/cells/M-astro-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app.pid`, `appbun1.log`, `appbun2.log`, `appbun3.log`, `appbun4.log`, `appbun5.log`, `appbun6.log`, `appbun7.log`, `appbun8.log`, `appbun9.log`, `appnode.log`, `appnode2.log`, `astro.config.mjs`, `dbboot.mjs`, `dcreq.mjs`, `dctest.mjs`, `dctest2.mjs`, `gc2.mjs`, `gc3.mjs`, `gctest.mjs`, `package-lock.json`, `package.json`, `pin.mjs`, `pin2.mjs`, `pinall.mjs`, `pinall2.mjs`, `pinboot.mjs`, `probe.mjs`, `runA.log`, `runA.pid`, `runB.log`, `runB.pid`, `runC.log`, `runC.pid`, `runD.log`, `runD.pid`, `runE.log`, `runE.pid`, `runF.log`, `runF.pid`, `runG.log`, `runG.pid`, `sentry.server.config.mjs`, `sentry.server.config.pin3.mjs`, `sentry.server.config.pinned.mjs`, `sentry.server.config.pinned2.mjs`, `sink.log`, `sink.pid`, `sink_b.log`, `sink_b.pid`, `sink_v2.log`, `src/`, `t_bun.log`, `t_node.log`, `timing.mjs`, `weak1.mjs`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. db spans do work on bun 1.4.0 with Astro 7.3.1 + @astrojs/node standalone + @sentry/astro 10.67.0 (develop), on both trace lifecycles and on both mysql2 code paths, after adding four lines to `sentry.server.config.mjs`. The other agent's two diagnoses (an "injected wrapper reads its own hasSubscribers=false" mystery and a "waitForTracingChannelBinding 1ms race") are both symptoms of one Bun runtime bug that I isolated to a 12-line script.

ROOT CAUSE (Bun, not the SDK, not Astro): Bun's `node:diagnostics_channel` registry does not keep a channel alive once it has subscribers. Node's registry does (its WeakReference map is incRef'd when a channel becomes active). On Bun, as soon as the *creator* of the handle drops it, the channel is collected and every subscriber is silently dropped; the next `tracingChannel(name)` call, from mysql2's `lib/tracing.js` or from the orchestrion-injected wrapper, gets a brand-new object with no subscribers. That is exactly why Sentry reads `hasSubscribers = true` and the wrapper reads `false`: two different channel objects for the same name.

Minimal repro, $REPRO/refutations/verify4-M-astro-bun-dbspans/weak1.mjs (A drops the handle, B keeps it on globalThis):
  == bun 1.4.0 ==            == node v26.5.0 ==
  sync    A: true   B: true   sync    A: true  B: true
  afterGC A: false  B: true   afterGC A: true  B: true
  +200ms  A: false  B: true   +200ms  A: true  B: true
  B fired                     A fired / B fired
This also explains toolbox finding K11 ("a driver whose instrumented module first loads inside a request gets no spans on Bun") — under Astro the db page chunk loads on the first request, long after `Sentry.init()` in the preload, so a GC has always run in between. The 1ms `waitForTracingChannelBinding` retry is a red herring: my run showed `mysql2:query start.hasSubscribers` = true synchronously after init on bun and false at +0ms, i.e. Sentry does subscribe, then loses it.

BASELINE (reproduces the report), `bun --preload ./sentry.server.config.mjs dist/server/entry.mjs`, traceLifecycle static, sink 53117 — 4 db routes, all empty:
  transaction | GET /db2   | []
  transaction | GET /pool2 | []
  transaction | GET /db1   | []
  transaction | GET /pool1 | []
  event | sentinel

FIXED, same build, same bun, only the pin added (traceLifecycle static):
  transaction | GET /db2   | ['db mysql2.connect', 'db SELECT id, name FROM users WHERE id > ?']
  transaction | GET /pool2 | ['db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT id, name FROM users WHERE id > ?']
  transaction | GET /db1   | ['db SELECT id, name FROM users WHERE id > 1']
  transaction | GET /pool1 | ['db SELECT id, name FROM users WHERE id > 1']

FIXED with traceLifecycle 'stream' (the develop default), same pin:
  span | ['db mysql2.connect', 'db SELECT users', 'http.server GET /db2']
  span | ['db mysql2.pool.connect', 'db mysql2.connect', 'db SELECT users', 'http.server GET /pool2']
  span | ['db SELECT users', 'http.server GET /db1']
  span | ['db SELECT users', 'http.server GET /pool1']

Both mysql2 ranges are covered by the one fix: /db2 and /pool2 use mysql2 3.24.3's native `mysql2:query|execute|connect|pool:connect` channels; /db1 and /pool1 use mysql@2.18.1 through the Astro integration's build-time `orchestrion:mysql:query` injection. So the orchestrion path the report tested with mysql2 3.19.1 is not separately broken — the same pin revives it.

Variants tried:
- Pin as a separate preload before init (`pinboot.mjs`) — works.
- Pin inside `sentry.server.config.mjs` after `Sentry.init()` (`sentry.server.config.pin3.mjs`) — works, and this is the form I recommend (same file the Astro integration already injects, no extra preload entry needed beyond the `--preload` the app needs anyway).
- Generic form, patching `tracingChannel`/`channel` on the CJS module object via `createRequire` to retain every channel ever created (`pinall2.mjs`) — works and needs no channel-name list; this is the shape an SDK-side fix would take. Patching the ESM namespace object instead throws `TypeError: Attempted to assign to readonly property` on bun, so `createRequire` is required for the generic form.
- Importing the drivers before init (`dbboot.mjs`: `import 'mysql2'; import 'mysql'`) — PARTIAL: fixes mysql2 (its own module-scope consts then own the channels) but not mysql@2, whose channels exist only in the Astro-bundled, orchestrion-transformed copy. So "load your driver early" is not a sufficient instruction.
- Node control with the same pin — unchanged, all db spans present. The pin is harmless on Node, so it can be applied unconditionally.
- No `--preload` at all is still required to be avoided (the integration only inlines init into `.astro` page chunks); that is the other agent's separate finding and I did not re-derive it.
- bun 1.3.14 (CI pin): not-run, `$SCRATCH/bun1314` no longer exists on this machine.

SDK-side fix location: `packages/server-utils/src/tracing-channel.ts` `bindTracingChannelToSpan()` receives the `TracingChannel` object and subscribes to it but keeps no reference; pushing the channel into a module-level array there (or in `packages/core/src/asyncContext/tracing-channel-binding.ts`'s callers) would make every channel-based integration — mysql2, mysql, redis, knex, graphql, mongoose, vercel-ai, postgres, the AI providers — survive GC on Bun. The repo's own reference app `dev-packages/e2e-tests/test-applications/astro-7` runs `node ./dist/server/entry.mjs` and never exercises bun, which is why this is uncovered.

Files (rerunnable): $REPRO/refutations/verify4-M-astro-bun-dbspans/ — `weak1.mjs` (runtime bug in isolation), `astro.config.mjs`, `sentry.server.config.mjs` (baseline), `sentry.server.config.pin3.mjs` (fix), `pinboot.mjs`, `pinall2.mjs`, `dbboot.mjs`, `src/pages/{db1.astro,db2.astro,pool1.ts,pool2.ts,sentinel.ts}`, `src/db-lib.ts`, logs `runA.log` (baseline) through `runG.log` (node control), `dist/` kept. `node_modules` removed; reinstall with `npm install $REPRO/_toolbox/pack/sentry-{astro,browser,browser-utils,bundler-plugins,core,feedback,node,opentelemetry,replay,replay-canvas,server-runtime-injection,server-utils}-10.67.0.tgz astro@^7.3.1 @astrojs/node@^11.1.5 mysql2 mysql`, then `npx astro build`. Run: `PORT=<p> HOST=127.0.0.1 SENTRY_TUNNEL=http://127.0.0.1:<sink>/ bun --preload ./sentry.server.config.pin3.mjs dist/server/entry.mjs`.

## Workaround

Add a channel pin to `sentry.server.config.mjs` (works before or after `Sentry.init()`, harmless on Node), then run with `bun --preload ./sentry.server.config.mjs dist/server/entry.mjs`:

    import * as Sentry from '@sentry/astro';
    import * as dc from 'node:diagnostics_channel';

    if (!Sentry.isInitialized()) {
      Sentry.init({ dsn: '...', tracesSampleRate: 1.0 });
    }

    // Bun drops diagnostics_channel subscriptions at the next GC; holding the
    // channel objects keeps Sentry's subscriptions alive.
    globalThis.__sentryPinnedChannels ??= [
      'mysql2:query', 'mysql2:execute', 'mysql2:connect', 'mysql2:pool:connect',
      'orchestrion:mysql:query', 'orchestrion:mysql2:query', 'orchestrion:mysql2:execute',
    ].map(name => dc.tracingChannel(name));

For a driver-agnostic version, retain every channel instead of listing names (must go in a file preloaded before `Sentry.init()`, and must patch the CJS module object — the ESM namespace is read-only on bun):

    import { createRequire } from 'node:module';
    const dc = createRequire(import.meta.url)('node:diagnostics_channel');
    const kept = (globalThis.__keptChannels = []);
    const [oc, ot] = [dc.channel, dc.tracingChannel];
    dc.channel = n => { const c = oc(n); kept.push(c); return c; };
    dc.tracingChannel = n => { const t = ot(n); kept.push(t); return t; };
    await import('./sentry.server.config.mjs');

## Docs impact

On Bun, `node:diagnostics_channel` does not keep a channel alive once it has subscribers, so Sentry's database, cache and AI instrumentation stops recording spans as soon as a garbage collection runs between `Sentry.init()` and the first query — keep the channels reachable by adding `globalThis.__sentryPinnedChannels ??= ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect','orchestrion:mysql:query','orchestrion:mysql2:query','orchestrion:mysql2:execute'].map(name => require('node:diagnostics_channel').tracingChannel(name));` to your `sentry.server.config.mjs`, and start the Astro Node build with `bun --preload ./sentry.server.config.mjs dist/server/entry.mjs`.
