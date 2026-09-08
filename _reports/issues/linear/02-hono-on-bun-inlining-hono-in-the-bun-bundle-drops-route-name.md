# Hono on Bun: inlining `hono` in the Bun bundle drops route names and error capture

Milestone: Bun + Framework gaps
Labels: JavaScript, Bun, Bug
Priority: Medium

`bun app.ts` with `@sentry/hono/bun` gives `GET /user/:id` (source `route`) and the `auto.http.hono.context_error` event. A `Bun.build` with `sentryBunPlugin()` and `external: ["@sentry/*"]` keeps `@sentry/hono` external but inlines `hono`; the middleware patches then miss, transactions fall back to `GET /user/42` (source `url`) and no error is captured. Keeping `hono` external as well, or dropping `external` entirely, restores both.

**Work item.** Make the patch survive an inlined `hono`, or detect the split at init and warn with the fix.

**Evidence.** Cell record M-hono-bun in `_reports/deep-probe-report.html`; reproduction `cells/M-hono-bun/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
