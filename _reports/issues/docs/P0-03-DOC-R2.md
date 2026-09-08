`platform-includes/crons/setup/javascript.deno.mdx:1` heads its first section "Automatic Check-Ins (Recommended)" and `:12` tells the reader to pass `Sentry.denoCronIntegration()` to `Sentry.init`.

That call crashes startup on current Deno. `packages/deno/src/integrations/deno-cron.ts:23` assigns `Deno.cron = new Proxy(Deno.cron, ...)`, but on Deno 2.9.0 `Deno.cron` is a getter-only property, so `Sentry.init` throws `TypeError: Cannot set property cron of #<Object> which has only a getter`. This reproduced in four separate audit runs. Line 18 returns silently when `Deno.cron` is missing, so without `--unstable-cron` the integration is a no-op. It is also not in the default set at `packages/deno/src/sdk.ts:31-49`, contrary to its JSDoc at `deno-cron.ts:64`.

What to change:

- Remove the "Recommended" framing and the `denoCronIntegration()` snippet, or label the integration as broken on Deno 2.9.
- Lead with the `Sentry.withMonitor` / `Sentry.captureCheckIn` sections already on the page.
- State that `Deno.cron` needs `--unstable-cron`.

---

_From the runtime docs audit of September 2026, item DOC-R2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
