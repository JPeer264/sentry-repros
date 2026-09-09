# SolidStart on Workers: no server-side code path and no server-to-client trace

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Feature
Priority: Medium

`@sentry/solidstart` has no Cloudflare export; its server entry initializes the Node SDK. The verified shape keeps `@sentry/solidstart` for the browser and wraps the built Nitro handler with `withSentry` from `@sentry/cloudflare` in a hand-written `worker.mjs`, with `@sentry/cloudflare` kept external through `server.rollupConfig` so Nitro does not inline a second copy. Skipping that external fails silently rather than loudly: `Sentry.setTag` and `captureException` in a route handler then run against an uninitialised client while the wrapper's request transactions keep arriving, so the setup looks healthy. Nitro emits no wrangler config for the `cloudflare-module` preset either, so `wrangler.jsonc` is hand-written too. Server errors need a Nitro plugin that forwards the `error` hook to `captureException`, and errors thrown while a page renders on the server stay uncaptured even with it, because SolidStart streams the render through a detached pipe. Route names come from the raw URL with source `url` under `static` and collapse to a bare `GET` under the default stream lifecycle, and nothing injects a `sentry-trace` meta tag into the SSR HTML, so there is no server-to-client continuation. Database spans were not exercised.

**Work item.** A `@sentry/solidstart/cloudflare` path: init from the Cloudflare SDK, the error hook, route naming from the file-route table, and the meta tags. Or a documented limit.

**Evidence.** Cell record M-solidstart-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-solidstart-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
