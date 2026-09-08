# verify4-M-astro-bun-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoingfetch** of cell `M-astro-bun` (see `$REPRO/cells/M-astro-bun/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration. Results for this cell and capability were recorded under the cell id, so the entries below may include the other independent attempt on the same capability.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app/`, `app-baseline.log`, `app-bunfetch-stream.log`, `app-bunfetch.log`, `app-node-bunfetch.log`, `app-rec-bun.log`, `app-rec-bun1314.log`, `app-rec-node.log`, `app.pid`, `app_a.log`, `app_b.log`, `app_c.log`, `app_d.log`, `app_e.log`, `app_node.log`, `astro.config.mjs`, `mini/`, `package-lock.json`, `package.json`, `pids.txt`, `rec-baseline.log`, `rec-bunfetch.log`, `rec.log`, `recorder.mjs`, `sentry.server.config.mjs`, `sentry.server.config.recommended.mjs`, `sink.log`, `sink.mjs`, `src/`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** works-after-all

REFUTED. The diagnosis was right (bun's native fetch never publishes undici's `undici:request:*` channels, so @sentry/node's NodeFetch instrumentation is dead on bun), but the conclusion "no outgoing-fetch instrumentation on Astro+bun" is wrong: @sentry/bun ships a channel-free fetch integration (`fetchIntegration`, built on `addFetchInstrumentationHandler` + `instrumentFetchRequest`, i.e. a global `fetch` monkey-patch) that is exported from the package's main entry and can be added to an @sentry/astro server init. Adding it makes both the `http.client` span and the propagation headers appear.

Isolation first ($REPRO/refutations/verify4-M-astro-bun-outgoingfetch/mini/probe.mjs, plain @sentry/node init + `startSpan` around one fetch, same build run three ways):
  node                       -> spans:["http.client GET http://127.0.0.1:47312/a-node"]     rec: sentry-trace + baggage present
  bun 1.4.0, stock           -> spans:[]                                                     rec: {"url":"/b-bun-nofix","sentry-trace":null,"baggage":null}
  bun 1.4.0 + fetchIntegration from @sentry/bun -> spans:["http.client GET http://127.0.0.1:47312/c-bun-fix"]  rec: sentry-trace + baggage present

Then end-to-end in a real Astro 7.3.1 / @astrojs/node 11.1.5 standalone build ($REPRO/refutations/verify4-M-astro-bun-outgoingfetch/app, @sentry/astro 10.67.0 develop tarballs), run as `bun --preload ./sentry.server.config.mjs dist/server/entry.mjs`, hitting `/fetchout` which does `fetch(REC + '/rec')`:

baseline (integrations: []) — reproduces the report exactly:
  {"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.astro","spans":[]}
  recorder: {"url":"/rec","sentry-trace":null,"baggage":null,"traceparent":null}

with `integrations: [bunFetchIntegration()]`, traceLifecycle 'static':
  {"type":"transaction","name":"GET /fetchout","op":"http.server","source":"route","status":"ok","trace_id":"49345d6fe5f848f8875a1a9065448e69","sdk":"sentry.javascript.astro","spans":["http.client GET http://127.0.0.1:47312/rec"]}
  recorder: {"url":"/rec","sentry-trace":"49345d6fe5f848f8875a1a9065448e69-aad2ccf7a704e27a-1","baggage":"sentry-environment=production,...,sentry-trace_id=49345d6fe5f848f8875a1a9065448e69,sentry-transaction=GET%20%2Ffetchout,sentry-sampled=true,..."}
  (trace_id of the client span's headers == trace_id of the server transaction, so propagation is correct, not just present)

same fix under the default traceLifecycle 'stream' — also works, correctly parented:
  {"type":"span","trace_id":"d8f42e1a820845958479bc35e2179e45","items":["http.client GET 127.0.0.1","http.server GET /fetchout"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"8a8d5150d51c43f1","is_segment":false,"origin":"auto.http.fetch"},{"name":"GET /fetchout","status":"ok","is_segment":true,"origin":"auto.http.astro"}]}

Caveat found and fixed: adding the integration unconditionally DOUBLE-instruments on node, because there both undici's channels and the monkey-patch fire:
  node + unconditional bunFetchIntegration -> spans:["http.client GET http://127.0.0.1:47312/rec","http.client GET http://127.0.0.1:47312/rec"]
Guarding on `typeof globalThis.Bun !== 'undefined'` gives exactly one `http.client` span on each runtime (verified from the same build: bun -> 1 span, node -> 1 span, both with correct headers).

SDK-side observation (not a blocker for users, worth a backlog item): @sentry/astro's server init always uses @sentry/node's default integration set, which contains only the undici-channel-based fetch instrumentation. Nothing in the SDK detects that it is running on bun and swaps in the bun-safe `fetchIntegration` the way `@sentry/bun`'s own `init()` does. Every framework SDK whose server half is @sentry/node (astro, nuxt, sveltekit, solidstart, react-router, remix, ...) will lose outgoing-fetch spans and trace propagation the moment its Node build is run on bun. A runtime check in the shared server default-integration list (`getDefaultIntegrations` / `@sentry/server-utils`) would fix all of them at once.

Files: $SCRATCH/deep/verify4-M-astro-bun-outgoingfetch/ — app/{astro.config.mjs,sentry.server.config.mjs,src/pages/{index.astro,fetchout.ts,sentinel.ts}}, mini/probe.mjs, recorder.mjs, logs app_a.log (baseline bun), app_b.log (bun+fix static), app_c.log (bun+fix stream), app_node.log (node duplication), app_d.log/app_e.log (guarded, bun/node), rec.log, sink.log.

Rerun: npm install --no-audit --no-fund astro @astrojs/node ; npm install --no-audit --no-fund $REPRO/_toolbox/pack/sentry-{astro,node,core,browser,server-utils,server-runtime-injection,opentelemetry,bundler-plugins,bun}-10.67.0.tgz ; PORT=47311 node $REPRO/_toolbox/sink.mjs & ; PORT=47312 node ../recorder.mjs & ; npx astro build ; PORT=47313 HOST=127.0.0.1 SENTRY_SINK=http://127.0.0.1:47311/ REC=http://127.0.0.1:47312 bun --preload ./sentry.server.config.mjs dist/server/entry.mjs ; curl http://127.0.0.1:47313/fetchout ; curl http://127.0.0.1:47311/__items

Reference read-only: ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/astro-7 (astro 7.2.4, @astrojs/node ^11.1.4, sentry.server.config.js with traceLifecycle 'static'). It is node-only; no bun variant exists in the e2e matrix for any Node-adapter framework app.

All started processes (sink 77188, recorder 77189, app 85307) were killed; ports 47311-47313 are free.

Workaround: In `sentry.server.config.mjs`, add @sentry/bun's `fetchIntegration` behind a bun check (install `@sentry/bun` alongside `@sentry/astro`; the guard is required, without it node builds emit two `http.client` spans per request):

import * as Sentry from '@sentry/astro';
import { fetchIntegration as bunFetchIntegration } from '@sentry/bun';

const isBun = typeof globalThis.Bun !== 'undefined';

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    integrations: isBun ? [bunFetchIntegration()] : [],
  });
}

Then build and run as before: `npx astro build && bun --preload ./sentry.server.config.mjs dist/server/entry.mjs`. No change to astro.config.mjs, the adapter, the entry shape, or the trace lifecycle is needed, and the fix holds for both `traceLifecycle: 'static'` and the default `'stream'`.

Docs impact: On the Astro (and any @sentry/node-backed framework) guide, under running the Node build on Bun: "Bun's native `fetch` does not emit the `undici` diagnostics channels that `@sentry/node` uses, so outgoing `fetch` calls produce no `http.client` span and carry no `sentry-trace`/`baggage` headers. Install `@sentry/bun` and add its `fetchIntegration()` to `Sentry.init` in `sentry.server.config.mjs`, guarded by `typeof globalThis.Bun !== 'undefined'` so the same config does not create duplicate `http.client` spans when the build is run on Node."
