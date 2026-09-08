# verify4-M-elysia-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + trace propagation) — Elysia 1.4.30 on Deno 2.9.0, develop SDK 10.67.0** of cell `M-elysia-deno` (see `$REPRO/cells/M-elysia-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `a-static.log`, `a-stream.log`, `app-a-static.log`, `app-a-stream.log`, `app-a.ts`, `app-b-stream.log`, `app-b.ts`, `app-b2.ts`, `app-c-stream.log`, `app-c.ts`, `app-c2.ts`, `app-d-static.log`, `app-d.ts`, `app-d2.ts`, `app-e2.ts`, `b-stream.log`, `c-stream.log`, `d-static.log`, `d-stream.log`, `deno.json`, `instrument-a.ts`, `instrument-d.ts`, `package-lock.json`, `package.json`, `pids.txt`, `pids2.txt`, `recorder.log`, `recorder.mjs`, `recorder2.log`, `recorder3.log`, `sink.log`, `sink2.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. An `http.client` span for a native outgoing `fetch` does appear on Deno, in three of the four wirings I ran. The original probe only ever tested `traceLifecycle: 'static'` with an unwrapped `fetch`, which is the exact one combination that produces headers-without-a-span.

Root cause (packages/core/src/fetch.ts:106-116, `instrumentFetchRequest`):
  const hasParent = !!getActiveSpan();
  const shouldEmitSpan = hasParent || (!!client && hasSpanStreamingEnabled(client));
  const span = shouldCreateSpanResult && shouldEmitSpan ? startInactiveSpan(...) : new SentryNonRecordingSpan();
So the span is dropped only when the lifecycle is `static` AND there is no active span at the fetch call site. Wiring (A) hits both: `traceLifecycle: 'static'` plus withElysia's Node branch, which (with no Deno.serve root span) leaves the handler body running outside any active span. Change either half and the span appears.

--- (A) @sentry/elysia, LIFECYCLE=stream (the default on develop). http.client span present.
sink: {"type":"span","trace_id":"4c16b4a3abaf4793b0eae2ff100c6418","items":["middleware sentryOnRequest","middleware Request","middleware Parse","middleware Transform","middleware BeforeHandle","http.client GET 127.0.0.1","handler /fetchout",...]}
raw: {"name":"GET 127.0.0.1","status":"ok","is_segment":true,"origin":"auto.http.fetch"}
recorder: {"url":"/rec-a","sentry-trace":"4c16b4a3abaf4793b0eae2ff100c6418-838ef34ae585f7bc-1","baggage":"...sentry-sampled=true,sentry-sample_rate=1"}

--- (A) @sentry/elysia, LIFECYCLE=static. Reproduces the original finding for a bare fetch, but a fetch wrapped in Sentry.startSpan gets the span even here.
sink (bare /fetchout): no http.client anywhere; recorder header is deferred-sampling: {"url":"/rec-a","sentry-trace":"20a1a97b26924856b31f0f90ddc330c6-a31362a7a96323f6"}  (no -1 flag)
sink (/fetchout-span): {"type":"transaction","name":"manual-wrap","spans":["http.client GET http://127.0.0.1:47103/rec-a-wrapped"]}
recorder: {"url":"/rec-a-wrapped","sentry-trace":"20a1a97b26924856b31f0f90ddc330c6-9ac5fe1151c75312-1",...}

--- (B) @sentry/deno alone + deep-imported withElysia, LIFECYCLE=stream. Confirms K2: no span and no headers, even under an active `manual-wrap` span. @sentry/deno's default set has denoHttpIntegration (node:http diagnostics channels) and denoServeIntegration, and nothing that patches globalThis.fetch.
sink: {"type":"span","items":[..."BeforeHandle","manual-wrap","handler /fetchout-span",...,"http.server GET /fetchout-span",...]}   <- no http.client
recorder: {"url":"/rec-b","sentry-trace":null,"baggage":null}
        {"url":"/rec-b-wrapped","sentry-trace":null,"baggage":null}

--- (D) THE FIX, fully public API, no deep import, works on BOTH lifecycles: init from @sentry/deno with `fetchIntegration()` added explicitly, and `withElysia` imported from @sentry/elysia's normal entry. @sentry/deno supplies the Deno.serve root span + isolation scope, withElysia's Node branch nests under it, and bun's fetchIntegration (re-exported by @sentry/elysia) patches globalThis.fetch.
instrument-d.ts: import "@sentry/deno/import"; import * as Sentry from "@sentry/deno"; import { fetchIntegration } from "@sentry/elysia";
                 Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static', integrations: [fetchIntegration()] });
app-d.ts:        import "./instrument-d.ts"; import { withElysia } from "@sentry/elysia"; const app = withElysia(new Elysia()).get(...); Deno.serve({port}, app.fetch);
sink: {"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"ea70a29c4bc44e3ba17adf1e2285923d","sdk":"sentry.javascript.deno","spans":["middleware Request","middleware sentryOnRequest","middleware Parse","middleware Transform","middleware BeforeHandle","handler Handle","http.client GET http://127.0.0.1:47103/rec-d","middleware AfterHandle","middleware sentryOnAfterHandle","middleware MapResponse"]}
recorder: {"url":"/rec-d","sentry-trace":"ea70a29c4bc44e3ba17adf1e2285923d-9df3176f9ec4fa7a-1","baggage":"sentry-environment=production,sentry-release=v4-d%401,sentry-public_key=public,sentry-trace_id=ea70a29c4bc44e3ba17adf1e2285923d,sentry-sampled=true,sentry-sample_rand=0.42888792665749076,sentry-sample_rate=1"}
Same wiring with LIFECYCLE=stream (file app-c.ts, which reaches withElysia by deep import) gives the streamed equivalent, correctly parented rather than an orphan segment:
sink: {"type":"span","items":[...,"http.client GET 127.0.0.1","handler /fetchout",...,"http.server GET /fetchout",...]}
raw: {"name":"GET 127.0.0.1","status":"ok","parent_span_id":"95a67d3da4db94a2","is_segment":false,"origin":"auto.http.fetch"}

Two side findings worth carrying forward. First, the original report's "(B) is the wiring that actually works but is not reachable through any public export" is itself refuted: `import { withElysia } from "@sentry/elysia"` works fine next to a `@sentry/deno` init (wiring D above produced `GET /fetchout` op `http.server` source `route` with the full middleware tree). The deep import into build/esm/withElysia.js is unnecessary; only the *init* has to come from @sentry/deno rather than @sentry/elysia's re-exported bun `init`. Second, the static + no-parent case does not merely lose the span, it emits a `sentry-trace` header with no sampling flag (`...-a31362a7a96323f6`), which defers the decision to the downstream service, so the caller's trace and the callee's transaction can end up disagreeing.

Probe files (all absolute): $SCRATCH/deep/verify4-M-elysia-deno-outgoingfetch/ — instrument-a.ts + app-a.ts (wiring A), app-b.ts (wiring B), app-c.ts (deno SDK + bun fetchIntegration + deep withElysia), instrument-d.ts + app-d.ts (the public-API fix), recorder.mjs (header recorder on 47103), deno.json, package.json, plus app-a-stream.log / app-a-static.log / app-b-stream.log / app-c-stream.log / app-d-static.log / sink.log. node_modules was removed after the run.

Rerun:
  cd <probe dir>
  npm install $S/pack/sentry-{elysia,bun,node,core,deno,opentelemetry,server-utils,server-runtime-injection}-10.67.0.tgz elysia@1
  PORT=51817 node $S/qs/sink.mjs > sink.log 2>&1 &
  node recorder.mjs > recorder.log 2>&1 &
  LIFECYCLE=stream APP_PORT=47102 deno run --no-prompt --allow-net --allow-env --allow-read --allow-sys --allow-ffi app-a.ts &
  curl -s http://127.0.0.1:47102/fetchout; curl -s http://127.0.0.1:47102/sentinel
  curl -s http://127.0.0.1:51817/__items; curl -s http://127.0.0.1:47103/__seen
(then the same for app-b.ts on 47104, app-c.ts on 47106, app-d.ts on 47107 with LIFECYCLE=static)

Repo reference read (read-only): ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/deno/tests/fetch.test.ts asserts only a *manual* span named `test-outgoing-fetch` around the fetch, never an `http.client` span — so the repo's own Deno e2e coverage does not exercise automatic fetch instrumentation and would not catch its absence. app.ts:133-141 wraps the fetch in `Sentry.startSpan`, i.e. it uses the same workaround by hand.

## Workaround

Two, in order of preference.

1. Best (public API, both lifecycles, correct nesting): init from @sentry/deno, add bun's fetchIntegration explicitly, and take withElysia from @sentry/elysia's normal entry.
   import "@sentry/deno/import";
   import * as Sentry from "@sentry/deno";
   import { fetchIntegration } from "@sentry/elysia";
   Sentry.init({ dsn, tracesSampleRate: 1.0, integrations: [fetchIntegration()] });
   // app file
   import { withElysia } from "@sentry/elysia";
   Deno.serve({ port }, withElysia(new Elysia()).get(...).fetch);
   This is the only combination that gives all three at once: an `http.server` root span, a nested `http.client` span, and sampled `sentry-trace`/`baggage` on the outgoing request. Non-Elysia Deno apps get the same by importing fetchIntegration from @sentry/bun.

2. If you must keep the documented `@sentry/elysia` init, either leave `traceLifecycle` at its `'stream'` default (span streaming emits `http.client` spans with no parent required), or wrap each outgoing call in `Sentry.startSpan(...)`. Both produce the span, but the request tree stays broken because @sentry/bun does not instrument Deno.serve, so every span is its own orphan segment.

## Docs impact

On Deno, `@sentry/deno` does not instrument the global `fetch` — add `fetchIntegration()` (exported from `@sentry/elysia`, or from `@sentry/bun` for a non-Elysia app) to `integrations` to get `http.client` spans and `sentry-trace`/`baggage` headers on outgoing requests; note also that an Elysia-on-Deno app must call `Sentry.init` from `@sentry/deno` (only `withElysia` comes from `@sentry/elysia`), because `@sentry/elysia`'s own `init` is `@sentry/bun`'s and does not instrument `Deno.serve`.
