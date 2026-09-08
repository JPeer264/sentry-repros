# verify4-M-nextjs-bun-dbspans

## What it re-tests

Independent re-test of the capability **db spans (Next.js 15.5.4 app router, @sentry/nextjs 10.67.0 develop, bun 1.4.0 via `bun --bun next build/start`)** of cell `M-nextjs-bun` (see `$REPRO/cells/M-nextjs-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO.md`, `app/`, `app-baseline.log`, `app-control.log`, `app-dcpatch.log`, `app-dcpatch2.log`, `app-dcstate-nopatch.log`, `app-dcstate.log`, `app-keep-stream.log`, `app-keep.log`, `build-baseline.log`, `build-bundled.log`, `build-dcpatch.log`, `build-dcpatch2.log`, `build-dcstate.log`, `build-keep.log`, `build1.log`, `build2.log`, `build3.log`, `build4.log`, `build5.log`, `build6.log`, `build7.log`, `build8.log`, `dcpatch-test.mjs`, `dctest.mjs`, `dctest2.mjs`, `dctest3.cjs`, `gctest.mjs`, `install.log`, `nextapp/`, `pids.txt`, `sdkdc-keep.mjs`, `sdkdc.mjs`, `server1.log`, `server2.log`, `server3.log`, `server4.log`, `server5.log`, `server6.log`, `server7-bun1314.log`, `server8-nopin.log`, `server9-stream.log`, `sink.log`, `sink.pid`, `srv.pid`, `standalone/`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. db spans do arrive on Next.js + bun, for both mysql2 and ioredis, with the reporter's exact wiring plus one six-line addition to `sentry.server.config.ts`. No import hook, no `NODE_OPTIONS`, no `--preload`, no `serverExternalPackages` change and no bundling change is needed.

The reporter's diagnosis was wrong on the mechanism. mysql2 3.24.3 (and ioredis 5.11.1) publish their own `node:diagnostics_channel` events natively; the SDK subscribes to `mysql2:query`/`:execute`/`:connect`/`:pool:connect` in `redis/mysql2` `setupOnce`, and mysql2 staying a bare external `require("mysql2/promise")` is irrelevant — `registrationOnly({ name: 'mysql2', versionRange: '>=3.20.0' })` in `packages/server-utils/src/orchestrion/config/mysql2.ts` means no code injection is wanted for that version. The real defect is that **bun garbage-collects the diagnostics_channel Channel objects that only Sentry's subscriber references**, so every channel-based subscription made by `Sentry.init()` is gone one tick later.

Proof, plain bun + `@sentry/node`, no Next.js (`app/t-probe4.mjs`):
```
sync subs= true
t50 subs= false
after import subs= false
after cmds subs= false
```
Holding a strong reference (`app/t-probe5.mjs`) fixes it:
```
sync subs= true
t50 subs= true
{"type":"transaction","name":"probe-keepref","op":"test",...,"spans":["db.query redis-get"]}
```
The identical script on node v26.5.0 already worked (`"spans":["db.query redis-set"]`, `"spans":["db.query redis-get"]`), so this is bun-specific.

A/B on one and the same Next.js production build (`bun --bun ./node_modules/.bin/next start -p 41778`), driven by curl:

CONTROL, `SENTRY_NO_PIN=1` (the pin dropped right after init) — reproduces the report exactly:
```
{"type":"transaction","name":"GET /app/api/db","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /app/api/db/route","start response"]}
{"type":"transaction","name":"GET /app/api/redis","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /app/api/redis/route","start response"]}
```
FIXED, same build, pin kept:
```
{"type":"transaction","name":"GET /app/api/db","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /app/api/db/route","db mysql2.pool.connect","db mysql2.connect","db SELECT id, name FROM users","start response"]}
{"type":"transaction","name":"GET /app/api/redis","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /app/api/redis/route","db.query redis-set","db.query redis-get","start response"]}
```
`traceLifecycle: 'stream'` works too, with the correct origin:
```
{"type":"span","items":["resolve page components","db mysql2.pool.connect","db mysql2.connect","db SELECT users"],"raw":[...,{"name":"SELECT users","origin":"auto.db.mysql2.diagnostic_channel"}]}
{"type":"span","items":["resolve page components","db.query redis-set","db.query redis-get"],"raw":[...,{"name":"redis-set","origin":"auto.db.redis.diagnostic_channel"}]}
```

Two of the reporter's observations are real but harmless: `[Sentry] Runtime hook not registered` is correct and unavoidable (bun 1.4.0 has no `Module.registerHooks`, and `packages/server-runtime-injection/src/register.ts` deliberately excludes Bun from the `Module.register` path), and `injected libraries=[]` is correct because mysql2 needs no injection at that version. Both are red herrings for db spans on a modern driver. They do matter for drivers below the native-channel cutoff (mysql2 < 3.20.0, ioredis < 5.11.0, mysql, pg, mongodb, ...): those need injection, and on Next.js only `ioredis` is un-externalized for build-time injection (`BUNDLE_SAFE_INSTRUMENTED_PACKAGES = ['ioredis']` in `packages/nextjs/src/config/diagnosticsChannelInjection.ts`), so old-driver spans on Next.js + bun stay unreachable — that part of the report stands.

Underlying SDK bug worth filing: `subscribeRedisDiagnosticChannels` / the mysql2 equivalent discard the handle returned by `bindTracingChannelToSpan`, so nothing holds a strong reference to the channels. Node's GC happens not to collect them in practice; bun's does, within one tick. A module-scope array of the subscribed channels inside `@sentry/server-utils` would fix it for every bun user without any app change.

Not run: bun 1.3.14 (the CI pin) — `$S/bun1314` does not exist on this machine.

Files: $SCRATCH/deep/verify4-M-nextjs-bun-dbspans/ (REPRO.md, app/, server1.log, server6.log, server8-nopin.log, server9-stream.log). Ports 41777 sink, 41778 app, 41779 redis. Redis container `deep-verify4-nextjs-bun-redis` started from redis:7-alpine and stopped again; all processes killed.

## Workaround

Add to `sentry.server.config.ts`, after `Sentry.init()`:

```ts
import * as dc from 'node:diagnostics_channel';

// Bun collects diagnostics_channel channels that only Sentry's subscriber references, so the
// subscriptions made by Sentry.init() are gone one tick later and no db span is recorded.
(globalThis as Record<string, unknown>).__sentryKeptChannels = [
  'mysql2:query',
  'mysql2:execute',
  'mysql2:connect',
  'mysql2:pool:connect',
  'ioredis:command',
  'ioredis:connect',
].map(name => dc.tracingChannel(name));
```

Any strong reference works (a module-scope `const` is enough); the point is that something other than the SDK's subscriber holds the channel objects. Requires a driver version that publishes native channels: mysql2 >= 3.20.0, ioredis >= 5.11.0, node-redis >= 5.12.0. Everything else in the reporter's recipe is unchanged, including `withSentryConfig` imported from `@sentry/nextjs/config` and no `serverExternalPackages` entry for mysql2.

## Docs impact

On Bun, keep a strong reference to the diagnostics channels after `Sentry.init()` — e.g. `globalThis.__sentryKeptChannels = ['mysql2:query','mysql2:execute','mysql2:connect','mysql2:pool:connect','ioredis:command','ioredis:connect'].map(n => require('node:diagnostics_channel').tracingChannel(n))` — otherwise Bun garbage-collects the channels Sentry subscribed to and database spans stop being recorded, even though the driver is instrumented and the SDK reports no error; this applies to any Bun-hosted app including Next.js run with `bun --bun next start`, and needs drivers new enough to publish native channels (mysql2 >= 3.20.0, ioredis >= 5.11.0, node-redis >= 5.12.0), since older drivers additionally need the runtime module hook that Bun cannot register.
