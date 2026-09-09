# Deno leaks the AsyncLocalStorage store across requests after a dynamic import

Milestone: Deno + Framework gaps
Labels: JavaScript, Deno, Bug
Priority: Medium

Deno restores the AsyncLocalStorage store of a handler that awaits a dynamic `import()` into the root async context, permanently. Node with the same build does not. Scope data set during one request (tags, user, contexts, breadcrumbs) then appears on later requests. This is a Deno defect rather than a framework one: it reproduces with zero Sentry, under `Deno.serve` and under `node:http`, and in `vite dev`. Fresh on Deno is confirmed broken because each route chunk loads lazily on its first request, which guarantees the dynamic import; Nuxt on the `deno_server` preset is partial, and SolidStart on Deno shows the same symptom without the mechanism being established for that stack. The app-level mitigation is a first middleware that scrubs the inherited isolation scope, clearing tags, contexts, extra, user, breadcrumbs and attachments off `getIsolationScope()`; `withIsolationScope(new Scope(), ...)` is not a substitute, it cleans the events and then attributes each request's tags to the following transaction.

**Work item.** File the upstream Deno bug with the minimal reproduction from the Fresh cell, and evaluate an SDK-side guard: a fresh isolation scope per `Deno.serve` request that does not inherit a stale store.

**Evidence.** Cell records M-fresh-deno, M-nuxt-deno, M-solidstart-deno in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproductions [`cells/M-fresh-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-fresh-deno), [`cells/M-nuxt-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-nuxt-deno), [`cells/M-solidstart-deno/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/cells/M-solidstart-deno), each with a README (Install, Run, Expected, Observed). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
