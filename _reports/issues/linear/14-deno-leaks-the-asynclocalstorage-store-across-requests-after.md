# Deno leaks the AsyncLocalStorage store across requests after a dynamic import

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

Deno leaks the AsyncLocalStorage store out of a handler that awaits a dynamic `import()`. Node with the same build does not. Scope data set during one request (tags, user, contexts, breadcrumbs) appears on later requests. Fresh on Deno is confirmed broken, because its route chunks load lazily; Nuxt on the `deno_server` preset and SolidStart on Deno are partial. The app-level mitigation is to replace the isolation scope in a middleware before `ctx.next()`.

**Work item.** File the upstream Deno bug with the minimal reproduction from the Fresh cell, and evaluate an SDK-side guard: a fresh isolation scope per `Deno.serve` request that does not inherit a stale store.

**Evidence.** Cell records M-fresh-deno, M-nuxt-deno, M-solidstart-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`cells/M-fresh-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-fresh-deno), [`cells/M-nuxt-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nuxt-deno), [`cells/M-solidstart-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
