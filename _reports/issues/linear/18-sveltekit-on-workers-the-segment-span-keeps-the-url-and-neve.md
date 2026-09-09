# SvelteKit on Workers: the segment span keeps the URL and never gets the route id

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

Unlike the Node SvelteKit SDK, the transaction or segment span on Workers is named by the Cloudflare request handler and keeps the raw URL: `GET /users/42` with source `url` under the static lifecycle, bare `GET` under the default stream lifecycle. The SvelteKit route id and `http.route` only reach a child span. This hits every route except `/`, because the Cloudflare wrapper keeps only a name whose source is already `route`, and SvelteKit's own `kit.experimental.tracing.server` makes it worse rather than better: on Cloudflare it removes the route-named `http.server` span entirely and leaves the route as an attribute on a function span. A user-land `handle` inserted between `initCloudflareSentryHandle` and `sentryHandle` fixes it in both lifecycles: take `getRootSpan(getActiveSpan())` from `@sentry/sveltekit`, call `updateName` with the method and `event.route.id`, then set `sentry.segment.name.source` to `route` and `http.route`. `Sentry.updateSpanName` is the wrong call there, it stamps source `custom`.

Database spans come from the transform `sentrySvelteKit()` already installs, but on a flat `node_modules` (npm or Yarn) the build fails until `ssr: { noExternal: ['@sentry/core', '@sentry/conventions', '@opentelemetry/api'] }` is added; pnpm needs nothing. The `/^@sentry\//` regex is not the shortcut it looks like, it force-bundles `@sentry/sveltekit` and boots the Node SDK inside the Worker.

**Work item.** Have `sentryHandle` rename the root span from `event.route.id` on Cloudflare, and look at why the flat install needs `noExternal`.

**Evidence.** Cell record M-sveltekit-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-sveltekit-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-sveltekit-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
