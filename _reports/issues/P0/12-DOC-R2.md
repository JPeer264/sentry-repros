`platform-includes/crons/setup/javascript.deno.mdx:1` heads its first section "Automatic Check-Ins (Recommended)" and `:12` tells the reader to pass `Sentry.denoCronIntegration()` to `Sentry.init`.

That call crashes startup on Deno 2.9.0 and later. `packages/deno/src/integrations/deno-cron.ts:23` assigns `Deno.cron = new Proxy(Deno.cron, ...)` inside `setupOnce`, i.e. inside `Sentry.init`. On Deno 2.8.3 `Deno.cron` is a writable data property and the integration works: a cron firing at the minute boundary produced one `in_progress` and one `ok` check-in. From Deno 2.9.0 `Deno.cron` is a getter-only accessor, so the assignment throws `TypeError: Cannot set property cron of #<Object> which has only a getter` and the process exits 1 before any user code runs.

There is a second failure mode without the unstable flag. When `Deno.cron` is absent the guard at `deno-cron.ts:18-21` returns silently, so the integration is an inert no-op and the SDK gives no warning, while the reader's own `Deno.cron(...)` call throws `TypeError: Deno.cron is not a function`. The integration is also not in the Deno default set (`packages/deno/src/sdk.ts:31-49`), although its own JSDoc at `deno-cron.ts:64` says "Enabled by default in the Deno SDK".

**What to change**

- Remove the "Recommended" framing and the `denoCronIntegration()` snippet, or state that it makes `Sentry.init` throw on Deno 2.9.0 and later and works only up to Deno 2.8.3.
- Lead with the `Sentry.withMonitor` / `Sentry.captureCheckIn` sections already on the page.
- State that `Deno.cron` needs `--unstable-cron`, and that without the flag the integration silently does nothing.
- Say that the integration has to be passed in `integrations` explicitly; it is not in the Deno default set.

---

_From the runtime docs audit of September 2026, item DOC-R2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
