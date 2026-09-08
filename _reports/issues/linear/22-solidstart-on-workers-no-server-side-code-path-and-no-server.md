# SolidStart on Workers: no server-side code path and no server-to-client trace

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Feature
Priority: Medium

`@sentry/solidstart` has no Cloudflare export; its server entry initializes the Node SDK. The verified shape keeps `@sentry/solidstart` for the browser and wraps the built Nitro handler with `withSentry` from `@sentry/cloudflare` in a hand-written `worker.mjs`, with `@sentry/cloudflare` kept external through `server.rollupConfig` so Nitro does not inline a second copy. Server errors need a Nitro plugin that forwards the `error` hook to `captureException`. Route names come from the raw URL, and nothing injects a `sentry-trace` meta tag into the SSR HTML, so there is no server-to-client continuation. Database spans were not exercised.

**Work item.** A `@sentry/solidstart/cloudflare` path: init from the Cloudflare SDK, the error hook, and the meta tags. Or a documented limit.

**Evidence.** Cell record M-solidstart-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-solidstart-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
