The v7 deprecation tables map old class names to functions that no longer exist. `platform-includes/migration/javascript-v8/v7-deprecation/javascript.bun.mdx:5` and `javascript.deno.mdx:5` point `new InboundFilters()` at `inboundFiltersIntegration()`, and `:10` in both points `new Debug()` at `debugIntegration()`. The same tables list `sessionTimingIntegration()` at `:14` and `nativeNodeFetchIntegration()` at `:24`.

On develop, `inboundFiltersIntegration`, `debugIntegration` and `sessionTimingIntegration` appear in no `packages/*/src` at all. The filtering integration is now `eventFiltersIntegration` (`packages/bun/src/index.ts:96` on develop, `:94` at the pin; `packages/deno/src/index.ts:72`, unchanged), a rename the migration guide already records at `docs/platforms/javascript/common/migration/v10-to-v11/index.mdx:1406`.

`nativeNodeFetchIntegration` is a different case. It still exists, is exported by `@sentry/node` (`packages/node/src/index.ts:2`) and is a default integration there (`packages/node/src/sdk/index.ts:63`); what is wrong is that neither `@sentry/bun` nor `@sentry/deno` re-exports it, so on these two pages the `new Undici()` row names something the reader cannot import.

The Deno table lists eight further names that `@sentry/deno` does not export: `consoleIntegration` (`:15`), `nodeContextIntegration` (`:16`), `modulesIntegration` (`:17`), `onUncaughtExceptionIntegration` (`:18`), `onUnhandledRejectionIntegration` (`:19`), `spotlightIntegration` (`:21`), `anrIntegration` (`:22`) and `httpIntegration` (`:25`). The same rows are correct in the Bun table: `@sentry/bun` re-exports all of them (`packages/bun/src/index.ts:75`, `:78`, `:79`, `:82`, `:83`, `:87`, `:89` and `:148` at the pin; `modulesIntegration` `:89`, `nodeContextIntegration` `:91` and `spotlightIntegration` `:150` on develop).

What to change:

- Point the `InboundFilters` row at `eventFiltersIntegration()` in both tables.
- Drop the `Debug` and `SessionTiming` rows from both tables.
- Drop the `Undici` row from both tables, or say that `nativeNodeFetchIntegration` lives in `@sentry/node` and is not re-exported by these two SDKs.
- Prune the Deno table to what `@sentry/deno` exports: remove the `Console`, `Context`, `Modules`, `OnUncaughtException`, `OnUnhandledRejection`, `Spotlight`, `Anr` and `Http` rows. Leave the Bun table's equivalents.

---

_From the runtime docs audit of September 2026, item DOC-R8, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
