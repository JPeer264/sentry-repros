# Oak on Deno: `app.listen()` runs handlers outside the request context

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

Mounted with `app.listen()`, Oak handlers run outside the request's async context: `getActiveSpan()` is undefined, errors are never captured, and tags and trace ids leak between requests. Nothing in user code repairs it. Mounted with `Deno.serve(app.fetch)`, errors, isolation, incoming trace, database spans and logs work with no extra wiring. Route names need a middleware registered before `app.use(router.routes())` that reads `ctx.matched?.at(-1)?.path` inside `try { await next(); } finally { ... }` and calls `updateSpanName` plus `SENTRY_SEGMENT_NAME_SOURCE` `route` and `http.route` on the root span; the same code placed after `await next()` instead silently skips every request whose handler throws.

`setHttpServerSpanRouteAttribute` from `@sentry/server-utils` does that renaming, and `@sentry/deno` does not re-export it.

**Work item.** Decide whether the `app.listen()` path can be instrumented. At minimum, make the SDK warn when a request handler runs with no active span, re-export the route-attribute helper from `@sentry/deno`, and consider an Oak route-naming integration.

**Evidence.** Cell record M-oak-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-oak-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-oak-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
