# Remix on Workers: the bare `@sentry/remix` import captures nothing in a webworker SSR build

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

In a Remix Vite build with `ssr.target: "webworker"`, `import * as Sentry from "@sentry/remix"` resolves to the browser build, `handleError` ends up undefined, and no error is captured, with only a rollup warning. The same code imported from `@sentry/remix/cloudflare` captures loader, action and resource-route errors and thrown 5xx responses on both lifecycles. Per-request isolation needs `withSentry` from `@sentry/cloudflare` around a handler built with `instrumentBuild`, and `makeWrappedCreateRequestHandler` from `@sentry/remix/cloudflare` must not be added on top: on Cloudflare it reports every request twice, as two `http.server` transactions in two traces. With `instrumentBuild` alone the event's `transaction` field stays unset, because nothing calls `isolationScope.setTransactionName`, so error grouping loses the route. `wrapRequestHandler` from the `/request` entry establishes no isolation on Workers at all (separate ticket). Database spans need `sentryCloudflareVitePlugin()` in the Vite config; without it, queries run, no span appears, and nothing warns.

Build with `remix vite:build`: a plain `vite build` under Vite 6 silently builds only the client and skips `build/server`.

**Work item.** Make the bare import fail loudly in a webworker build, or resolve it to the Cloudflare entry through the export conditions. Set the isolation scope's transaction name from the Remix route so events carry one.

**Evidence.** Cell record M-remix-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-remix-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-remix-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
