# Fresh on Deno: errors swallowed, no route names, and the route Fresh sets is dropped for lack of a context manager

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

Three separate gaps. Fresh's `App.handler()` catches every route and middleware error and renders its own 500, so nothing reaches Sentry; `captureConsoleIntegration({ levels: ["error"] })` or an explicit capture in the app's error handler works. Spans stay unparameterized unless a middleware reads `ctx.route` and calls `updateSpanName` on the root span. Fresh itself sets `http.route` through `trace.getActiveSpan()` from `@opentelemetry/api`, which returns `undefined` because the Deno SDK registers a tracer provider but no context manager, so Fresh's own route enrichment is lost.

Database spans need every driver in both `ssr.external` and `environments.ssr.build.rollupOptions.external`, because `@fresh/plugin-vite` sets `resolve.noExternal: true`.

**Work item.** Register an OpenTelemetry context manager on Deno so framework-set attributes reach the active span, and consider a Fresh integration for errors and route names.

**Evidence.** Cell record M-fresh-deno in `_reports/deep-probe-report.html`; reproduction `cells/M-fresh-deno/`, each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
