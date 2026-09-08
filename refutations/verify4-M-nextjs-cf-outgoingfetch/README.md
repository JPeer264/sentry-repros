# verify4-M-nextjs-cf-outgoingfetch

## What it re-tests

Independent re-test of the capability **outgoing fetch (http.client spans + trace headers) from a Next.js App Router route handler on Cloudflare Workers via @opennextjs/cloudflare, @sentry/nextjs 10.67.0 (develop / v11)** of cell `M-nextjs-cf` (see `$REPRO/cells/M-nextjs-cf/`). A second agent rebuilt the app from scratch and tried to make the capability work, with the documented setup and with a different reasonable configuration.

## Install and Run

No README was written during the run. The app files, run scripts and logs in this directory are the run as it happened: `build-A.log`, `build1.log`, `build2.log`, `build3.log`, `install.log`, `install1.log`, `install2.log`, `next-env.d.ts`, `next.config.js`, `open-next.config.ts`, `package-lock.json`, `package.json`, `rec.log`, `rec.mjs`, `rec.pid`, `sentry.edge.config.ts`, `sentry.server.config.BASELINE-broken.ts`, `sentry.server.config.FIXED.ts`, `sentry.server.config.ts`, `sink.log`, `sink.mjs`, `sink.pid`, `src/`, `tsconfig.json`, `wr.pid`, `wrangler.jsonc`, `wrangler.patched.jsonc`, `wrangler1.log`, `wrangler2.log`, `wrangler3.log`

## Expected

The cell reported this capability as broken or partial. Refuting it means making it work with shipped exports.

## Observed

**Verdict:** partial

Rebuilt the probe from scratch (the earlier agent's M-nextjs-cf/ directory no longer exists) at $SCRATCH/deep/verify4-M-nextjs-cf-outgoingfetch/ and reproduced their result, then refuted the "cannot work" half of it.

SETUP (same versions they used, but wrangler config copied from the repo's own e2e app nextjs-16-cf-workers: compatibility_date 2025-12-01, compatibility_flags ["nodejs_compat", "global_fetch_strictly_public"], which is stricter/newer than their 2026-05-01 + nodejs_compat only):
  npm install next@15.5.25 react@19 react-dom@19 typescript@5 @types/react @types/node @opennextjs/cloudflare@1.20.6 wrangler@4
  npm install $S/pack/sentry-{nextjs,core,node,react,browser,browser-utils,bundler-plugins,opentelemetry,server-utils,server-runtime-injection,vercel-edge,replay,replay-canvas,feedback,cloudflare}-10.67.0.tgz
  PORT=47311 node $S/qs/sink.mjs &   PORT=47312 node rec.mjs &   (rec.mjs records sentry-trace/baggage on /__rec)
  npx opennextjs-cloudflare build ; npx wrangler dev --port 47313 --inspector-port 0
Routes: src/app/api/{ping,outfetch,outhttp,sentinel}/route.ts. /api/outfetch does a global fetch() to the recorder, /api/outhttp does a node:http GET to it.

RUN 1 - documented wiring (sentry.server.config.BASELINE-broken.ts, traceLifecycle 'static'). CONFIRMS THEIR CLAIM, build1.log / wrangler1.log:
  outfetch: {"ok":true,"where":"outfetch","rec":"recorded"}
  {"type":"transaction","name":"GET /api/outfetch","op":"http.server","source":"route","status":"ok","sdk":"sentry.javascript.nextjs","spans":["resolve page components","executing api route (app) /api/outfetch/route","start response"]}
  {"type":"transaction","name":"GET /api/outhttp","op":"http.server",...,"spans":["resolve page components","executing api route (app) /api/outhttp/route","start response"]}
  recorder: [{"url":"/__rec?from=outfetch","sentry-trace":null,"baggage":null,"traceparent":null},{"url":"/__rec?from=outhttp","sentry-trace":null,"baggage":null,"traceparent":null}]
No http.client span, no headers, for either fetch() or node:http. The newer compat date and global_fetch_strictly_public change nothing.

ROOT CAUSE (read in the SDK, not guessed): packages/nextjs/src/server/index.ts:138-183 - on OpenNext/Cloudflare the SDK only swaps contexts.runtime to 'cloudflare' and the sdk metadata to ['nextjs','cloudflare'], then still calls `nodeInit` from @sentry/node. Outgoing HTTP therefore depends on @sentry/node's undici/NodeFetch + node:http instrumentation, which patches an undici instance that workerd's global fetch is not. @sentry/cloudflare's runtime-agnostic `fetchIntegration` (packages/cloudflare/src/integrations/fetch.ts, a `addFetchInstrumentationHandler` + `instrumentFetchRequest` wrapper around globalThis.fetch) is never installed on this path, and @sentry/cloudflare is not even a dependency of @sentry/nextjs.

RUN 2 - REFUTATION, one added integration (sentry.server.config.FIXED.ts, traceLifecycle 'static'), build2.log / wrangler2.log:
  {"type":"transaction","name":"GET /api/outfetch","op":"http.server","source":"route","status":"ok","spans":["resolve page components","executing api route (app) /api/outfetch/route","http.client GET http://127.0.0.1:47312/__rec","start response"]}
  {"type":"transaction","name":"GET /api/outhttp","op":"http.server",...,"spans":[...,"http.client GET http://127.0.0.1:47312/__rec","start response"]}
  recorder: [{"url":"/__rec?from=outfetch","sentry-trace":"2e8013c474304c9a8b39a312e043d7bf-994b6fc4ac6ed8cd-1","baggage":"sentry-environment=production,sentry-public_key=public,sentry-trace_id=2e8013c474304c9a8b39a312e043d7bf,sentry-transaction=GET%20%2Fapi%2Foutfetch,sentry-sampled=true,sentry-sample_rand=0.487...,sentry-sample_rate=1"}, {"url":"/__rec?from=outhttp","sentry-trace":"d5cf36e31b094b009c23b139cca54e1c-8f16fc134f5cc807-1","baggage":"...sentry-transaction=GET%20%2Fapi%2Fouthttp..."}]
The trace_id in the header matches the transaction's trace_id, so the span is correctly parented. node:http is fixed too, because unenv routes node:http through global fetch.

RUN 3 - same fix with traceLifecycle 'stream' and NO tracePropagationTargets (build3.log / wrangler3.log), to show neither is load-bearing:
  {"type":"span","trace_id":"eb26125052c74a71a6fc4e88f42e0ab6","items":["resolve page components","http.client GET 127.0.0.1"],"raw":[...,{"name":"GET 127.0.0.1","status":"ok","parent_span_id":"9914b3dac32a2e3f","is_segment":false,"origin":"auto.http.fetch"}]}
  {"type":"span","trace_id":"eb26125052c74a71a6fc4e88f42e0ab6","items":["executing api route (app) /api/outfetch/route","start response","http.server GET /api/outfetch"]}
  recorder: sentry-trace "eb26125052c74a71a6fc4e88f42e0ab6-ae71972d2b639341-1" + full baggage, same for outhttp.

WHAT I ALSO CHECKED (all negative as fixes on their own): the newer/stricter wrangler compat pair from the repo e2e app; traceLifecycle 'static' vs 'stream'; the docs page's own compatibility_date >= 2025-08-16 advice (that is about https.request for the transport, not about client spans).

REFERENCE APP: ~/dev/sentry-worktrees/audit-runtime-docs/dev-packages/e2e-tests/test-applications/nextjs-16-cf-workers uses exactly the documented wiring (instrumentation.ts -> sentry.server.config.ts, withSentryConfig from '@sentry/nextjs/config', defineCloudflareConfig()) and asserts nothing about server-side outgoing HTTP. Its only 'http.client' assertion (tests/prefetch-spans.test.ts:19) is a browser-side prefetch span. So this gap is uncovered by the repo's own e2e suite.

Verdict is `partial` and not `works-after-all` because the default and documented setup really does produce zero outgoing-HTTP telemetry, exactly as reported; it is `partial` and not `confirmed-broken` because a one-line, public-API change fully restores spans and header propagation for both fetch() and node:http, under both trace lifecycles.

DOCS PAGE: ~/dev/sentry-docs/docs/platforms/javascript/guides/cloudflare/frameworks/nextjs.mdx covers only nodejs_compat and compatibility_date, and closes with "You should start seeing error events, traces, and logs appear in Sentry." It never mentions that outgoing HTTP is uninstrumented there.

## Workaround

Install @sentry/cloudflare alongside @sentry/nextjs (it is NOT a transitive dependency) and add its runtime-agnostic fetch integration to the server config:

  // sentry.server.config.ts
  import * as Sentry from '@sentry/nextjs';
  import { fetchIntegration } from '@sentry/cloudflare';

  Sentry.init({
    dsn: '...',
    tracesSampleRate: 1.0,
    integrations: [fetchIntegration()],
  });

Verified in both traceLifecycle 'static' and 'stream'; no tracePropagationTargets needed (undefined already means propagate everywhere). It fixes global fetch() and node:http alike. Files: .../deep/verify4-M-nextjs-cf-outgoingfetch/sentry.server.config.FIXED.ts vs sentry.server.config.BASELINE-broken.ts. Rerun with: npx opennextjs-cloudflare build && npx wrangler dev --port 47313 --inspector-port 0, sink on 47311, recorder rec.mjs on 47312 (node_modules was removed after the run; reinstall with the two npm install lines above).

The proper fix in the SDK would be for packages/nextjs/src/server/index.ts to push @sentry/cloudflare's fetchIntegration into customDefaultIntegrations when getCloudflareRuntimeConfig() detects OpenNext/Cloudflare, the same place it already overrides contexts.runtime and the sdk metadata.

## Docs impact

On docs/platforms/javascript/guides/cloudflare/frameworks/nextjs.mdx, after the Wrangler section: "On Cloudflare Workers the Next.js SDK cannot instrument outgoing HTTP requests automatically, because the Workers runtime provides a native `fetch` rather than the Node.js `undici` implementation the SDK patches. Requests you make from Server Components, route handlers, or Server Actions will produce no `http.client` span and will not carry `sentry-trace`/`baggage` headers, so the trace stops at your Worker. To get them, install `@sentry/cloudflare` and add its `fetchIntegration()` to your `sentry.server.config.ts`: `import { fetchIntegration } from '@sentry/cloudflare'; Sentry.init({ /* ... */ integrations: [fetchIntegration()] });` This also covers `node:http` calls, which the Workers Node compatibility layer routes through `fetch`."
