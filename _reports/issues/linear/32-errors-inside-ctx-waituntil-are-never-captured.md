# Errors inside `ctx.waitUntil()` are never captured

Milestone: CF Functionality Gaps
Labels: JavaScript, Cloudflare Workers, Bug
Priority: High

An error thrown or a promise rejected inside `ctx.waitUntil(promise)` is never captured. `packages/cloudflare/src/client.ts:285` hands the promise to the invocation's `waitUntil` and does nothing else, and `captureException` has zero occurrences in `packages/cloudflare/src/flush.ts`, so no error-capture path is attached on any lifecycle. What was measured is the stream lifecycle: workerd logs `Uncaught Error` for both the throwing function and the rejected promise, the routes answer 200, and the sink receives nothing before the sentinel. `ctx.waitUntil(work().catch(e => Sentry.captureException(e)))` is the app-side shape.

**Work item.** Wrap the promise handed to `waitUntil` so a rejection is captured once, then rethrown.

**Evidence.** Probe record C01 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`probes/C01/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/C01). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
