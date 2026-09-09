# Fresh on Deno: errors swallowed, no route names, and the route Fresh sets is dropped for lack of a context manager

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

Three separate gaps. Fresh's `App.handler()` catches every route and middleware error and renders its own 500, so nothing reaches Sentry. `captureConsoleIntegration({ levels: ["error"], handled: false })` reports them, but only while Fresh's own handler is the one logging: it goes silent the moment the app registers `app.onError("*")`, and such an app has to call `captureException` inside that handler, or use `setErrorInterceptor` from `jsr:@fresh/core/internal` as the least intrusive alternative. Spans stay unparameterized unless a middleware reads `ctx.route` and calls `updateSpanName` on the root span. Fresh itself sets `http.route` through `trace.getActiveSpan()` from `@opentelemetry/api`, which returns `undefined` because the Deno SDK registers a tracer provider but no context manager, so Fresh's own route enrichment is lost; a context manager bridging the two makes Fresh name its own routes with no middleware at all.

Database spans need `mysql@2`, because `mysql2` dies on the JSON-require bug under the import hook, and every driver listed in both `ssr.external` and `environments.ssr.build.rollupOptions.external`, because `@fresh/plugin-vite` sets `resolve.noExternal: true` and `ssr.external` alone does not survive the build.

**Work item.** Register an OpenTelemetry context manager on Deno so framework-set attributes reach the active span, and consider a Fresh integration for errors and route names.

**Evidence.** Cell record M-fresh-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-fresh-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-fresh-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
