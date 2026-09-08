# Elysia on Deno: `@sentry/elysia` init delegates to the Bun SDK and never instruments `Deno.serve`

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

With `Sentry.init` from `@sentry/elysia`, there is no `http.server` span on Deno, every request in the process shares one trace, incoming `sentry-trace` headers are ignored, and tags and request URLs bleed between concurrent requests, because that init delegates to `@sentry/bun`. Initializing from `@sentry/deno` before `Deno.serve` and importing only `withElysia` (plus `fetchIntegration` from `@sentry/elysia` for outgoing requests) makes errors, route names, isolation, incoming trace, outgoing fetch, database spans and logs work, at the cost of `sdk.name` reporting `sentry.javascript.deno`.

**Work item.** Pick the base SDK by runtime in `@sentry/elysia`. Same root as JS-3582 and JS-3583 on Node.

**Evidence.** Cell record M-elysia-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-elysia-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-elysia-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
