# verify4-M-elysia-deno-routenames

## What it re-tests

Independent re-test of the capability **route names (Elysia 1.4.30 on Deno 2.9.0, develop / 10.67.0)** of cell `M-elysia-deno` (see `$REPRO/cells/M-elysia-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-a.log`, `app-a.ts`, `app-c-stream.log`, `app-c.log`, `app-c.ts`, `app-d.log`, `app-d.ts`, `app-e.log`, `app-e.ts`, `app-e2.log`, `app-f.log`, `app-f.ts`, `app-r1.ts`, `deno.json`, `instrument-a.ts`, `instrument-deno.ts`, `package-lock.json`, `package.json`, `routes.ts`, `sink.log`, `v4a.log`, `v4a.pid`, `v4a.ts`, `v4r1.log`, `v4r1.pid`, `v4r1.ts`, `v4r1b.log`, `v4r1b.pid`, `v4r1s.log`, `v4r1s.pid`, `v4r2.log`, `v4r2.pid`, `v4r2.ts`, `v4r3.log`, `v4r3.pid`, `v4r3.ts`, `v4r4.log`, `v4r4.pid`, `v4r4.ts`, `v4routes.ts`, `v4sink.log`, `v4sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

The behavior the other agent saw is real, but its conclusion "not reachable through any public export" is wrong. No deep import is needed: `Sentry.init()` from `@sentry/deno` plus `import { withElysia } from "@sentry/elysia"` (the package's own public entry) gives correct route names in BOTH trace lifecycles.

Probe dir: $SCRATCH/deep/verify4-M-elysia-deno-routenames/ (node_modules removed; reinstall with the npm line below).

Install (in that dir, package.json `{"type":"module"}`, deno.json `{"nodeModulesDir":"manual"}`):
  npm install elysia@1 @elysiajs/node $S/pack/sentry-{elysia,bun,node,core,deno,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz
Sink: PORT=52117 node $S/qs/sink.mjs > v4sink.log 2>&1 &

=== Baseline, wiring A reproduced (v4a.ts, `import * as Sentry from "@sentry/elysia"` + Sentry.init + Deno.serve), LIFECYCLE=static, port 52121 ===
{"type":"transaction","name":"Request","op":"middleware","source":"custom","trace_id":"20f7dbd8...","sdk":"sentry.javascript.bun","spans":["middleware sentryOnRequest"]}
{"type":"transaction","name":"Handle","op":"handler","source":"custom","trace_id":"20f7dbd8...","sdk":"sentry.javascript.bun","spans":[]}
{"type":"transaction","name":"AfterResponse","op":"middleware","source":"custom","trace_id":"20f7dbd8...","sdk":"sentry.javascript.bun","spans":[]}
No op http.server anywhere; every request reuses the SAME trace_id 20f7dbd88cb74058ad370517079835bb (no isolation), and the sentinel event carries a stale `"transaction":"GET /boom"`. Report CONFIRMED for this wiring.

=== Refutation R1 (v4r1.ts) — public exports only, no deep import ===
  import "@sentry/deno/import";                       // optional, see R3
  import * as Sentry from "@sentry/deno";  Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: ... });
  import { withElysia } from "@sentry/elysia";        // package entry, NOT build/esm/withElysia.js
  import { Elysia } from "elysia";
  const app = withElysia(new Elysia()).get("/users/:id", ...);
  Deno.serve({ port, hostname: "127.0.0.1" }, app.fetch);
  deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi v4r1.ts

static (port 52122):
{"type":"transaction","name":"GET /users/:id","op":"http.server","source":"route","status":"ok","trace_id":"5801b166...","sdk":"sentry.javascript.deno","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"]}
{"type":"transaction","name":"GET /boom","op":"http.server","source":"route","status":"internal_error","trace_id":"24751ee3...","spans":[...,"middleware Error","middleware sentryOnError"]}
{"type":"event","exception":"Error: v4-boom","mechanism":"auto.http.elysia.on_error","handled":false,"sdk":"sentry.javascript.deno","runtime":"deno","transaction":"GET /boom","trace_id":"24751ee3..."}
Distinct trace_id per request.

stream (port 52123), raw span items:
{"name":"GET /users/:id","op":"http.server","seg":true,"src":"route","route":"/users/:id","parent":"","id":"ab465ba6"}
{"name":"/users/:id","op":"handler","seg":false,"route":"/users/:id","parent":"ab465ba6"}
{"name":"Request","op":"middleware","seg":false,"parent":"ab465ba6"} ... plus Parse/Transform/BeforeHandle/AfterHandle/MapResponse/AfterResponse, all seg=false under the one segment.
Exactly one segment per request, named `GET /users/:id`, source route.

Isolation under 3 concurrent /tag/<t> + sentinel (stream): correct per-request tags and traces —
{"ex":"tagged-aaa","tags":{"reqtag":"aaa"},"trace":"03ade202","url":".../tag/aaa"}
{"ex":"tagged-bbb","tags":{"reqtag":"bbb"},"trace":"eeb3a666","url":".../tag/bbb"}
{"ex":"tagged-ccc","tags":{"reqtag":"ccc"},"trace":"4ad2dda1","url":".../tag/ccc"}

=== Other variants ===
R3 (v4r3.ts, same as R1 but WITHOUT `import "@sentry/deno/import"`): route names still correct — {"name":"GET /users/:id","op":"http.server","source":"route","sdk":"sentry.javascript.deno"}. The hook is only needed for library (mysql etc.) instrumentation, not for the server span.
R2 (v4r2.ts, @sentry/deno init + `@elysiajs/node` adapter + app.listen, needs --unstable-net for Deno.listen reusePort): also correct — {"name":"GET /users/:id","op":"http.server","source":"route","sdk":"sentry.javascript.deno"}.
R4 (v4r4.ts, the documented Node.js wiring on Deno: @sentry/elysia init + @elysiajs/node adapter): BROKEN the same way as A — Request/Parse/.../AfterResponse each their own `source":"custom"` transaction, sdk sentry.javascript.bun.
So the deciding factor is which init runs, not the adapter or the lifecycle: `@sentry/elysia`'s init is `@sentry/bun`'s (packages/elysia/src/sdk.ts), which instruments neither `Deno.serve` nor Deno's `node:http`, and it additionally filters out `bunServerIntegration`, so nothing creates a root span. `withElysia`'s `isBun()` guard (`typeof Bun !== 'undefined'`, packages/elysia/src/withElysia.ts) is false on Deno, so it takes the "HTTP instrumentation already made a root span" branch. With `@sentry/deno` init that assumption holds and the whole path works unchanged.

Minor, not runtime-specific: a `captureException` called inside the handler has no `transaction` field, because `updateRouteTransactionName` sets the isolation-scope name in onAfterHandle/onError, i.e. after the handler ran. Errors thrown out of the handler (onError path) do carry `"transaction":"GET /boom"`.

Reference read-only: ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/elysia-{bun,node}/src/app.ts — both use `Sentry.init` from `@sentry/elysia`; there is no Deno e2e app for Elysia.

## Workaround

On Deno, do not call `@sentry/elysia`'s `init()`. Init with `@sentry/deno` and take only `withElysia` from `@sentry/elysia` — both are public exports, no deep import into build/esm needed:

  import * as Sentry from "@sentry/deno";
  Sentry.init({ dsn: "...", tracesSampleRate: 1.0 });

  import { withElysia } from "@sentry/elysia";
  import { Elysia } from "elysia";
  const app = withElysia(new Elysia()).get("/users/:id", ({ params }) => ({ id: params.id }));
  Deno.serve({ port: 3000 }, app.fetch);

Works with `Deno.serve` + `app.fetch` and with the `@elysiajs/node` adapter + `app.listen()`, and in both `traceLifecycle: 'static'` and `'stream'`. Prepend `import "@sentry/deno/import";` as the first line only if you also want library (database, AI) spans. Cost of this wiring: events are tagged `sdk: sentry.javascript.deno` rather than an elysia SDK identifier, and Elysia-specific default-integration tuning in `@sentry/elysia`'s `init` is not applied (on Deno that tuning is a no-op anyway — it only removes `bunServerIntegration`).

## Docs impact

The Elysia guide (~/dev/sentry-docs/docs/platforms/javascript/guides/elysia/index.mdx, which today lists only "Bun or Node.js 18+ (with @elysiajs/node adapter)") needs a Deno tab stating: "On Deno, install `@sentry/deno` alongside `@sentry/elysia`, call `Sentry.init()` from `@sentry/deno`, and import only `withElysia` from `@sentry/elysia` — `@sentry/elysia`'s own `init()` is the Bun/Node SDK and does not instrument `Deno.serve`, so calling it leaves every Elysia lifecycle phase as its own root transaction with no `GET /route` server span and no per-request isolation scope."
