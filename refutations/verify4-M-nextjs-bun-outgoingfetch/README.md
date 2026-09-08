# verify4-M-nextjs-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client span + sentry-trace/baggage propagation) from a Next.js 15.5.4 app-router route handler running on bun 1.4.0 with @sentry/nextjs 10.67.0 (develop)** of cell `M-nextjs-bun` (see `$REPRO/cells/M-nextjs-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `REPRO.md`, `app/`, `app.pid`, `pack/`, `pids.txt`, `recorder.log`, `recorder.mjs`, `server-baseline.log`, `server-fetchonly-stream.log`, `server-fetchonly.log`, `server-fix.log`, `server-stream.log`, `sink.log`, `sink.mjs`, `sink.pid`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The claim reproduces exactly with the reported wiring, but it is a missing-integration problem, not a platform limitation. Adding `fetchIntegration()` from `@sentry/bun` to `Sentry.init` in `sentry.server.config.ts` restores both the `http.client` span and the propagation headers, under BOTH trace lifecycles.

Probe dir: $SCRATCH/deep/verify4-M-nextjs-bun-outgoingfetch/ (REPRO.md, sink.mjs, recorder.mjs, app/, server-baseline.log, server-fix.log, server-stream.log; app/node_modules removed after the run, REPRO.md has the reinstall line).

BASELINE (no fetchIntegration, traceLifecycle 'static') - reproduces the report:
  recorder /__hits: {"url":"/hit","sentry-trace":null,"baggage":null,"traceparent":null}
  sink: {"type":"transaction","name":"GET /app/api/fetchout","op":"http.server","spans":["resolve page components","executing api route (app) /app/api/fetchout/route","start response"]}
  -> no http.client span, no headers. `Integration installed: NodeFetch` is present in server-baseline.log but never fires: bun's native fetch emits no undici diagnostics channels.

FIX (app/sentry.server.config.ts):
  import { fetchIntegration } from '@sentry/bun';
  import * as Sentry from '@sentry/nextjs';
  Sentry.init({ dsn, tunnel, tracesSampleRate: 1.0, traceLifecycle: 'static', integrations: [fetchIntegration()] });
plus `@sentry/bun` in the app's dependencies. server-fix.log shows `Integration installed: Fetch` alongside `Integration installed: NodeFetch`.

AFTER, traceLifecycle 'static' (server-fix.log):
  recorder /__hits:
    "sentry-trace": "7d2699e81a7a482e988f1af7b36ce9e8-9987b591f02565e2-1"
    "baggage": "sentry-environment=production,sentry-public_key=public,sentry-trace_id=7d2699e81a7a482e988f1af7b36ce9e8,sentry-transaction=GET%20%2Fapi%2Ffetchout,sentry-sampled=true,sentry-sample_rand=0.367495436561904,sentry-sample_rate=1"
  sink transaction "GET /app/api/fetchout", trace_id 7d2699e81a7a482e988f1af7b36ce9e8:
    spans: ["resolve page components","executing api route (app) /app/api/fetchout/route","http.client GET http://127.0.0.1:41822/hit","start response"]
    the http.client span is {"op":"http.client","description":"GET http://127.0.0.1:41822/hit","span_id":"9987b591f02565e2","origin":"auto.http.fetch"}
  The header's span id (9987b591f02565e2) and trace id match the emitted http.client span exactly, so the downstream service continues the same trace.

AFTER, default 'stream' lifecycle, and with NO explicit tracePropagationTargets (server-stream.log):
  recorder: "sentry-trace": "aa02efe64b2e4b9bb7a5c77e35a85235-95cf1f8492e6e32d-1", baggage present
  sink span envelope, env trace aa02efe64b2e4b9bb7a5c77e35a85235:
    http.client | GET 127.0.0.1 | span_id 95cf1f8492e6e32d | origin auto.http.fetch
    http.server | GET /app/api/fetchout | span_id 8431cd66b22af755 | origin auto
  Same trace, header span id equals the http.client span id. (Note the low-cardinality stream span name `GET 127.0.0.1` vs the static-lifecycle description `GET http://127.0.0.1:41822/hit`; that is the expected develop naming, not a defect.)

Reference used: the repo's own e2e app ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/nextjs-16-bun/ already does exactly this. Its sentry.server.config.ts imports `bunHttpServerIntegration` and `fetchIntegration` from `@sentry/bun` next to `Sentry.init` from `@sentry/nextjs`, its package.json lists `@sentry/bun` as a dependency, and tests/propagation.test.ts asserts the http.client span id equals the downstream `sentry-trace` span id. So the SDK ships and tests this combination; only the docs are silent.

Everything else the report says about the wiring held: `withSentryConfig` is only on `@sentry/nextjs/config` on develop, `bun --bun` is required, `contexts.runtime` is still {"name":"node","version":"v26.3.0"}-style (my sink showed runtime "node"). Those are separate findings; this capability is not broken.

Commands: (in app/) `PROBE_TUNNEL=http://127.0.0.1:41821/ PROBE_RECORDER=http://127.0.0.1:41822/hit bun --bun ./node_modules/.bin/next build` then `... next start -p 41823`; drive with `curl -s http://127.0.0.1:41823/api/fetchout` followed by `curl -s http://127.0.0.1:41823/api/sentinel` (sentinel captures a message and flushes). All started processes were killed.

## Workaround

Add `@sentry/bun` to the Next.js app's dependencies and register its `fetchIntegration()` in the server init:

// sentry.server.config.ts
import { fetchIntegration } from '@sentry/bun';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [fetchIntegration()],
});

No build, bundler or hook change is needed; `bun --bun next build` / `bun --bun next start` are unchanged. `@sentry/node`'s NodeFetch integration stays installed and simply never fires, so there is no double instrumentation. The same file should normally also add `bunHttpServerIntegration({ spans: false })` for per-request isolation (see the repo's nextjs-16-bun e2e app), which is a separate capability from this one.

## Docs impact

On the Next.js guide, in a "Running Next.js on Bun" section: "Bun's `fetch` is native and does not emit the `undici` diagnostics channels that `@sentry/node` instruments, so outgoing `fetch` calls produce no `http.client` span and no `sentry-trace`/`baggage` headers by default. When you run Next.js with `bun --bun`, install `@sentry/bun` alongside `@sentry/nextjs` and add `fetchIntegration()` from `@sentry/bun` to `integrations` in `sentry.server.config.ts` (add `bunHttpServerIntegration({ spans: false })` there too, so each incoming request gets its own isolation scope and trace)."
