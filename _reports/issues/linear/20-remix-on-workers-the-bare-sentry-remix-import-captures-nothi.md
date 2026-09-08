# Remix on Workers: the bare `@sentry/remix` import captures nothing in a webworker SSR build

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

In a Remix Vite build with `ssr.target: "webworker"`, `import * as Sentry from "@sentry/remix"` resolves to the browser build, `handleError` ends up undefined, and no error is captured, with only a rollup warning. The same code imported from `@sentry/remix/cloudflare` captures loader, action and resource-route errors and thrown 5xx responses on both lifecycles. Per-request isolation needs `withSentry` from `@sentry/cloudflare` around a handler built with `instrumentBuild`; `wrapRequestHandler` from the `/request` entry does not establish isolation on Workers unless the async-context strategy is set first (separate ticket). Database spans need `sentryCloudflareVitePlugin()` in the Vite config; without it, queries run, no span appears, and nothing warns.

**Work item.** Make the bare import fail loudly in a webworker build, or resolve it to the Cloudflare entry through the export conditions.

**Evidence.** Cell record M-remix-cf in `_reports/deep-probe-report.html`; reproduction `cells/M-remix-cf/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
