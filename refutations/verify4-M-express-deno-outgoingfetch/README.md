# verify4-M-express-deno-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (Express 5.2.1 on Deno 2.9.0, @sentry/deno develop @ 10.67.0)** of cell `M-express-deno` (see `$REPRO/cells/M-express-deno/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `app-baseline-stream.log`, `app-cf.ts`, `app-fetchint-static.log`, `app-fetchint-stream.log`, `app.pid`, `app.ts`, `deno.json`, `instrument-cf.ts`, `instrument.ts`, `jsonfix.ts`, `package-lock.json`, `package.json`, `pids.txt`, `rec.log`, `recorder.mjs`, `run-b-app-baseline-stream.log`, `run-b-app-fetchint-static.log`, `run-b-app-fetchint-stream.log`, `run-b-rec.log`, `run-b-sink.log`, `run-b.sh`, `run-c-app-cf-stream.log`, `run-c-app.log`, `run-c-rec-cf-stream.log`, `run-c-rec.log`, `run-c-sink-cf-stream.log`, `run-c-sink.log`, `run-c.sh`, `sink.log`, `sink.mjs`, `userland-fetch-integration.ts`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Probe dir: $SCRATCH/deep/verify4-M-express-deno-outgoingfetch/ (express@5.2.1, symlinked develop SDK, deno.json `{"nodeModulesDir":"manual"}`, `@sentry/deno/import` + the deno#36240 jsonfix load hook).

REPRODUCED (default integrations, stream lifecycle) — `bash run-b.sh baseline stream 52121`:
  {"type":"span","items":["handler /downstream","http.server GET /downstream"],"raw":[{"name":"/downstream","origin":"auto.http.express"},{"name":"GET /downstream","is_segment":true,"origin":"auto.http.server"}]}
  recorder: {"url":"/hit-fetch","sentry-trace":null,"baggage":null,"traceparent":null}
Same request via node:http in the same app does get a span and headers:
  {"type":"span","items":["http.client GET 127.0.0.1","handler /downstream-http","http.server GET /downstream-http"] ... origin "auto.http.client"}
  recorder: {"url":"/hit-nodehttp","sentry-trace":"befad6f8...-983bab417e96d0e1-1","baggage":"...sentry-transaction=GET%20%2Fdownstream-http,sentry-sampled=true..."}

REFUTED, the "dead unless you switch to node:http" part. Root cause is not Express and not Deno: `packages/deno/src/sdk.ts` `getDefaultIntegrations()` simply ships no fetch integration. `packages/bun/src/integrations/fetch.ts` and `packages/cloudflare/src/integrations/fetch.ts` are byte-for-byte equivalent, runtime-agnostic, and built only from `@sentry/core` exports (`addFetchInstrumentationHandler`, `instrumentFetchRequest`, `isSentryRequestUrl`) that patch `globalThis.fetch`. Deno has `globalThis.fetch`, so that code works there unchanged.

WORKS with a ~25-line user-land integration (userland-fetch-integration.ts) passed as `integrations: [denoFetchIntegration()]`.
  stream (`bash run-b.sh fetchint stream 52122`):
    {"type":"span","trace_id":"60217e698f7c4acb9cde5aeafa13dd4b","items":["http.client GET 127.0.0.1","handler /downstream","http.server GET /downstream"],"raw":[{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"9d8fab8b0d462c15","origin":"auto.http.fetch"},...]}
    recorder: {"url":"/hit-fetch","sentry-trace":"60217e698f7c4acb9cde5aeafa13dd4b-8e20fe10c8dc2b31-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=60217e698f7c4acb9cde5aeafa13dd4b,sentry-transaction=GET%20%2Fdownstream,sentry-sampled=true,sentry-sample_rate=1"}
  static (`bash run-b.sh fetchint static 52123`):
    {"type":"transaction","name":"GET /downstream","op":"http.server","source":"route","spans":["handler /downstream","http.client GET http://127.0.0.1:52118/hit-fetch"]}
  Trace ids match the server span, the client span is a child of the express handler span, and both lifecycles behave.

ALSO WORKS with zero custom code by importing the shipped Cloudflare one on Deno (`instrument-cf.ts`, `bash run-c.sh app-cf.ts stream 58221 58222 58223 cf-stream`): `import { fetchIntegration } from "@sentry/cloudflare"` →
    {"type":"span","trace_id":"89938fe80bac42db8a0094aa5d43476a","items":["http.client GET 127.0.0.1","handler /downstream","http.server GET /downstream"] ... origin "auto.http.fetch"}
    recorder: {"url":"/hit-fetch-cf","sentry-trace":"89938fe80bac42db8a0094aa5d43476a-bc38198b4153b049-1","baggage":"...sentry-transaction=GET%20%2Fdownstream..."}
It proves the mechanism but is not a wiring anyone should ship (pulls the Cloudflare SDK into a Deno app).

So: the reported observation is correct for the default integration set, and the "known Deno K2 gap" is real, but it is a one-file omission in `@sentry/deno`, not a runtime limitation, and it is fully fixable today without touching the app's transport. Partial because nothing in the shipped `@sentry/deno` surface or in the docs offers this — no `fetchIntegration` is exported from `@sentry/deno`, and `denoHttpIntegration` is node:http-only (it subscribes to `node:diagnostics_channel`, so it can never see `fetch`).

SDK fix, one PR: copy `packages/bun/src/integrations/fetch.ts` to `packages/deno/src/integrations/fetch.ts`, export `fetchIntegration` from `packages/deno/src/index.ts`, and add `fetchIntegration()` to `getDefaultIntegrations()` in `packages/deno/src/sdk.ts` next to `denoHttpIntegration()`.

Ports 52117/52118 collided with another agent mid-run (run-c-*.log without a tag suffix); that run was discarded and rerun on 58221-58223, which is the evidence quoted above. All processes I started were killed. `node_modules` (express + 4 SDK symlinks) left in place so the probe reruns as-is.

## Workaround

Add a fetch integration in user land. Create `userland-fetch-integration.ts`:

import { addFetchInstrumentationHandler, defineIntegration, getClient, instrumentFetchRequest, isSentryRequestUrl } from "@sentry/core";
const spans: Record<string, any> = {};
export const denoFetchIntegration = defineIntegration(() => ({
  name: "DenoUserlandFetch",
  setupOnce() {
    addFetchInstrumentationHandler((handlerData: any) => {
      const client = getClient();
      if (!client || isSentryRequestUrl(handlerData.fetchData.url, client)) return;
      instrumentFetchRequest(handlerData, () => true, () => true, spans, { spanOrigin: "auto.http.fetch" });
    });
  },
}));

then `Sentry.init({ ..., integrations: [denoFetchIntegration()] })`. Works on both trace lifecycles, produces `http.client` spans with origin `auto.http.fetch` parented under the Express handler span, and sends `sentry-trace` + `baggage` downstream. Switching the call site to `node:http` also works (that path is instrumented by `denoHttpIntegration`), but it is no longer necessary.

## Docs impact

The Deno guide must state that `@sentry/deno` does not instrument outgoing `fetch` out of the box: only `node:http`/`node:https` client calls get `http.client` spans and `sentry-trace`/`baggage` headers, so a handler that calls `fetch()` starts a new trace downstream unless you register a fetch integration yourself (`docs/platforms/javascript/guides/deno/` currently has only `index.mdx` plus `configuration/integrations/{breadcrumbs,contextlines}.mdx`, and the breadcrumbs page's `fetch` option is the single mention of fetch anywhere in the guide, which reads as if fetch were instrumented).
