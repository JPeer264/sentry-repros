# `denoCronIntegration` crashes `init` on Deno 2.9, and its JSDoc claims a default it is not

Milestone: Deno Functionality Gaps
Labels: JavaScript, Deno, Bug
Priority: High

`packages/deno/src/integrations/deno-cron.ts:23` assigns `Deno.cron = new Proxy(Deno.cron, ...)`. On Deno 2.8.3, the CI pin, `Deno.cron` is a writable data property and the integration works, sending one `in_progress` and one `ok` check-in. From Deno 2.9.0 it is a getter-only accessor, so `Sentry.init` with this integration throws `TypeError: Cannot set property cron of #<Object> which has only a getter` and the process exits 1. The guard at lines 18-21 returns silently when `Deno.cron` is absent, so without `--unstable-cron` the integration is an inert no-op with no warning while the reader's own `Deno.cron(...)` throws `TypeError: Deno.cron is not a function`. The JSDoc at line 64 says "Enabled by default", but the integration is not in the default set at `packages/deno/src/sdk.ts:31-49`.

**Work item.** Define the proxy with `Object.defineProperty(Deno, 'cron', { value, writable: true, configurable: true })`, which succeeds on both Deno versions, add Deno 2.9 to CI (JS-3524), fix the JSDoc.

**Evidence.** Probe record D11 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`probes/D11/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/D11). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
