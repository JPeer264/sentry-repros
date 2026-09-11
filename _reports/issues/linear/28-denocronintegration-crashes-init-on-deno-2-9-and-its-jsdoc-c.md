# `denoCronIntegration` crashes `init` on Deno 2.9, and its JSDoc claims a default it is not

Milestone: Deno Functionality Gaps
Labels: JavaScript, Deno, Bug
Priority: High

`packages/deno/src/integrations/deno-cron.ts:23` assigns `Deno.cron = new Proxy(Deno.cron, ...)`. On Deno 2.8.3, the CI pin, `Deno.cron` is a writable data property and the integration works, sending one `in_progress` and one `ok` check-in. From Deno 2.9.0 it is a getter-only accessor, so `Sentry.init` with this integration throws `TypeError: Cannot set property cron of #<Object> which has only a getter` and the process exits 1. The guard at lines 18-21 returns silently when `Deno.cron` is absent, so without `--unstable-cron` the integration is an inert no-op with no warning while the reader's own `Deno.cron(...)` throws `TypeError: Deno.cron is not a function`. The JSDoc at line 64 says "Enabled by default", but the integration is not in the default set at `packages/deno/src/sdk.ts:31-49`.

The fix is in the repository already, one file over. `denoServeIntegration` wraps `Deno.serve` with `Object.defineProperty` inside a try/catch (`packages/deno/src/integrations/deno-serve.ts:111-124`), including the `writable: true` comment that explains why. `denoCronIntegration` was never updated to match.

Measured on Deno 2.9.0 on 2026-09-11, with `--unstable-cron`: the property descriptor of `Deno.cron` is a getter with no setter, and `configurable: true`. Plain assignment throws the message above; `Object.defineProperty(Deno, 'cron', { value: proxy, writable: true, configurable: true, enumerable: true })` succeeds, and the proxy still intercepts, a real `Deno.cron('slug', schedule, opts, fn)` registration ran the `apply` trap and returned normally. Without the flag `Deno.cron` is `undefined` and no descriptor exists, so the guard is right to return; only its silence is wrong.

**Work item.** Three parts, all local to `deno-cron.ts`:

- Replace the assignment with the `Object.defineProperty` plus try/catch shape of `deno-serve.ts:111-124`.
- Warn on the guard path (`debug.warn('Deno.cron is not available. Run with --unstable-cron ...')`), the convention `deno-serve.ts:123` and `transports/index.ts:22` already use.
- Fix the JSDoc at line 64, which claims a default the SDK does not apply.

Add Deno 2.9 to CI (JS-3524) so the version split is covered.

**Docs sequencing.** The docs item DOC-R2 currently tells readers the integration is broken on Deno 2.9.0 and later. If this fix ships in v11, that wording has to become a minimum SDK version instead. Land the SDK change first, or write the docs change to name both.

**Evidence.** Probe record D11 in the [deep probe report](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/deep-probe-report.html); reproduction [`probes/D11/`](https://github.com/JPeer264/sentry-repros/tree/issue-linear-runtime-improvements/probes/D11). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
