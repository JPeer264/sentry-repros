# SvelteKit on Workers: the segment span keeps the URL and never gets the route id

Milestone: Cloudflare + Framework gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

Unlike the Node SvelteKit SDK, the transaction or segment span on Workers is named by the Cloudflare request handler and keeps the raw URL: `GET /users/42` with source `url` under the static lifecycle, bare `GET` under the default stream lifecycle. The SvelteKit route id and `http.route` only reach a child span. A user-land `handle` inserted between `initCloudflareSentryHandle` and `sentryHandle` that renames the root span with `getActiveSpan` and `getRootSpan` from `@sentry/sveltekit` fixes it in both lifecycles.

Database spans come from the transform `sentrySvelteKit()` already installs, but on a flat `node_modules` (npm or Yarn) they are missing until `ssr: { noExternal: [/^@sentry\//] }` is added; pnpm needs nothing.

**Work item.** Have `sentryHandle` rename the root span from `event.route.id` on Cloudflare, and look at why the flat install needs `noExternal`.

**Evidence.** Cell record M-sveltekit-cf in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-sveltekit-cf/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-sveltekit-cf), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
