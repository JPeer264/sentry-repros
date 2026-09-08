`platform-includes/configuration/integrations/javascript.bun.mdx:5-37` lists `dedupeIntegration` (`:9`), `nativeNodeFetchIntegration` (`:24`) and `inboundFiltersIntegration` (`:14`) as auto-enabled, and `pinoIntegration` at `:47`, while `fsIntegration` is shown for Bun with no row.

What was observed: the Bun SDK installs 42 integrations at `6f2da7483d`, and 43 on develop head, where `mastraIntegration()` joined `getTracingIntegrations()`. It ships `fetchIntegration` rather than `nativeNodeFetchIntegration`, installs inbound filtering as `EventFilters`, and does not install `dedupeIntegration`. Integrations installed with no row in the table: `fetchIntegration`, `bunHttpServerIntegration`, `processSessionIntegration`, `expressIntegration`, `fastifyIntegration`, `hapiIntegration`, `koaIntegration`, `awsIntegration`, `langGraphIntegration`, `postgresJsIntegration`, `spanStreamingIntegration` and `mastraIntegration`. The list is produced by `getDefaultIntegrations()` in `packages/bun/src/sdk.ts:77-79`, which spreads `getDefaultIntegrationsWithoutPerformance()` at `:47-74`, plus `packages/server-utils/src/integrations/index.ts:30-62` (`:30-63` on develop head). `spanStreamingIntegration` is not part of that list: the client adds it in `packages/core/src/server-runtime-client.ts:56`, so a table generated from `getDefaultIntegrations()` alone would still miss it. The channel-based integrations only produce spans after a `Bun.build` with `@sentry/bun/plugin`.

What to change:

- Drop the `dedupeIntegration` row; rename `nativeNodeFetchIntegration` to `fetchIntegration`; rename `inboundFiltersIntegration` to the installed `eventFiltersIntegration`.
- Add rows for the twelve installed integrations listed above.
- Add a "Requires `@sentry/bun/plugin`" column and tick it for the channel-based rows.
- Fix the gating so `common/configuration/integrations/pino.mdx` is shown for Bun, and give `fsIntegration` a row or hide it.

---

_From the runtime docs audit of September 2026, item DOC-B2, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
