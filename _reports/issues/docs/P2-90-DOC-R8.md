The v7 deprecation tables map old class names to functions that no longer exist. `platform-includes/migration/javascript-v8/v7-deprecation/javascript.bun.mdx:5` and `javascript.deno.mdx:5` point `new InboundFilters()` at `inboundFiltersIntegration()`, and `:10` in both points `new Debug()` at `debugIntegration()`. The same tables list `sessionTimingIntegration()` at `:14` and `nativeNodeFetchIntegration()` at `:24`.

On develop none of those four symbols appears in `packages/core/src`, `packages/bun/src` or `packages/deno/src`. The filtering integration is now `eventFiltersIntegration` (`packages/bun/src/index.ts:94`, `packages/deno/src/index.ts:72`). The Deno table also lists Node-only names that `@sentry/deno` does not export: `modulesIntegration`, `nodeContextIntegration`, `anrIntegration`, `spotlightIntegration`, `onUncaughtExceptionIntegration` and `httpIntegration`.

What to change:

- Point the `InboundFilters` row at `eventFiltersIntegration()`.
- Remove rows for symbols that no longer exist on develop.
- Prune the Deno table to the exports in `packages/deno/src/index.ts`.

---

_From the runtime docs audit of September 2026, item DOC-R8, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
