# Elysia on Deno: `@sentry/elysia` init delegates to the Bun SDK and never instruments `Deno.serve`

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: High

With `Sentry.init` from `@sentry/elysia`, there is no `http.server` span on Deno, every Elysia lifecycle phase becomes its own root transaction on one process-wide trace, incoming `sentry-trace` headers are ignored, and the isolation scope carries the previous request's route into the next event, because that init delegates to `@sentry/bun`.

Two wirings fix it, both from shipped exports and both exercised in the static and the stream lifecycle. Initialize from `@sentry/deno` before `Deno.serve` and import only `withElysia` from `@sentry/elysia`, or keep `Sentry.init` from `@sentry/elysia` and pass `integrations: [denoServeIntegration()]` from `@sentry/deno`. Errors, route names, isolation, incoming trace, database spans and logs then work, with `fetchIntegration()` from `@sentry/elysia`, a re-export of the Bun integration, for outgoing requests. The wiring decides what events report: `sdk.name` `sentry.javascript.deno` in the first, `sentry.javascript.bun` with `contexts.runtime.name` `bun` and session envelopes in the second.

**Work item.** Pick the base SDK by runtime in `@sentry/elysia`. Same root as JS-3582 and JS-3583 on Node.

**Evidence.** Cell record M-elysia-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`cells/M-elysia-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-elysia-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
