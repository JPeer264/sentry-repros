# Oak on Deno: `app.listen()` runs handlers outside the request context

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

Mounted with `app.listen()`, Oak handlers run outside the request's async context: `getActiveSpan()` is undefined, errors are never captured, and tags and trace ids leak between requests. Mounted with `Deno.serve(app.fetch)`, errors, isolation, incoming trace, database spans and logs work with no extra wiring. Route names need a `router.use()` middleware registered before the routes that renames the span from `ctx.matched?.at(-1)?.path` and sets the segment name source to `route`.

**Work item.** Decide whether the `app.listen()` path can be instrumented. At minimum, make the SDK warn when a request handler runs with no active span, and consider an Oak route-naming integration.

**Evidence.** Cell record M-oak-deno in `_reports/deep-probe-report.html`; reproduction `cells/M-oak-deno/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
