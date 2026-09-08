# Docs audit: re-check of 27 items (Bun, Deno, Cloudflare, cross-cutting, quick starts)

Checked on 2026-09-08 against:

- docs: `/Users/janpeer/dev/sentry-docs` at master `aebda0ee4` (the audit cited `046ce5942`, re-checked at `b568ebbd3`)
- SDK as audited: worktree `/Users/janpeer/dev/sentry-worktrees/audit-runtime-docs` at `6f2da7483d`
- SDK today: develop head `03aaf42455`, read file by file via `gh api .../contents/<path>?ref=develop`
- released line: `ref=master` (`@sentry/cloudflare` 10.67.0), used to separate "wrong today" from "wrong at v11"
- reproductions: `quickstarts/{node,bun,deno,cloudflare}/README.md` and `results-*.json` for DOC-Q1 to DOC-Q6

## Result

| verdict | items |
| --- | --- |
| correct-and-open | DOC-B1, B2, B3, D1, D2, D3, D4, D5, D6, C2, C4, C5, C6, C7, X1, X3, Q4, Q5, Q6 (19) |
| partially-correct | DOC-B4, C1, C3, C8, X2, Q1, Q2, Q3 (8) |
| correct-but-fixed-on-master | none outright |
| wrong | none |

Nothing is wholly wrong. Three items lost their main premise to docs commits that landed after the
audit (`DOC-C3`, `X2`, `DOC-Q2`), five need a bullet dropped or a sentence corrected, and most of the
rest only need line numbers moved.

## Items that need editing before they ship

### DOC-C3 — the headline is fixed, only the leftovers are open
Commit `3acad630b` (#19198) replaced `enableRpcTracePropagation` in all three files and added an
`SdkOption` for `rpcTracePropagationBindings` (`options.mdx:580-592`). What remains: `cacheClient`,
`enableOpenTelemetrySetup`, `durableObjectSqlSpanAllowlist`, `durableObjectStorageSpanAllowlist` are
still undocumented (0 doc hits each), and the now-deprecated `enableRpcTracePropagation` block at
`options.mdx:594-600` has to go at v11. The SDK citation is off by one: the option is declared at
`packages/cloudflare/src/client.ts:360`.

### X2 — the page exists now
`docs/platforms/javascript/common/migration/v10-to-v11/index.mdx` landed today (`e4d245f972`, #19217,
1473 lines) and already carries DOC-C1 to DOC-C5 at `:948-993`. The real finding survives: the page
names none of `@sentry/bun/plugin`, `sentryBunPlugin` or `@sentry/deno/import` (0 hits), has no Bun
section, and repeats the objectionable framing at `:689` ("Most setups need no changes."). Retitle to
"add the per-runtime setup to the v10-to-v11 page" and drop the "make the Cloudflare section carry
DOC-C1..C5" bullet.

### DOC-Q2 — two of the three observations are now wrong or overstated
The `instrument.server.*` step is documented since `9bfe0e96c` (#19199) at `vite-plugin.mdx:88-99`,
including `:99` "the SDK reads all configuration ... from the Worker's `env` bindings at runtime".
Two SDK facts contradict the item as written: the `() => undefined` fallback is a deliberate hand-off
to `env` (`packages/cloudflare/src/options.ts:68` resolves `dsn ?? getEnvVar(env, 'SENTRY_DSN')`), and
the plugin *does* warn when no wrangler config parses
(`packages/cloudflare/src/vite/autoInstrument.ts:34-40`). The reproduction's own note
(`quickstarts/cloudflare/README.md:341-347`) says the silent run happened because a *different*,
default-named `wrangler.jsonc` was picked up — that is the failure mode to describe.

### DOC-Q1 and DOC-Q3 — the "named transactions" premise is not what the pages say
`getting-started-node/javascript.mdx:120`, `bun/index.mdx:188`, `deno/index.mdx:207` and
`cloudflare/index.mdx:364` are all exact lines, but every one reads "head over to your project on
Sentry.io ... to view the collected data", and the `quick-start-locate-data-expandable` include
renders "Open the **Traces** page and select a trace" (`src/components/featureInfo.tsx:46-59`). The
word "transaction" is on none of them. Both items also need v11 scoping: on released `master`
`packages/core/src/client.ts` does no `traceLifecycle` normalization, so `static` is the default and a
transaction *is* sent; develop normalizes to `stream` at `client.ts:243`. Add the ten
`platform-includes/performance/enable-stream-mode/javascript.*.mdx` files that call `'static'` "(the
default)" to DOC-Q1's fix list.

### DOC-C1 and DOC-C8 — one bullet each is already done
DOC-C1's last bullet is moot: `getting-started-config/javascript.cloudflare.mdx:5` has said
`nodejs_compat` is required since before the audit. DOC-C8's Astro `dataCollection` bullet is fixed —
`ae4b46502` (#19208) removed the block; it was already gone at the re-check commit `b568ebbd3`.

### DOC-B4 — the breadcrumbs bullet points at the wrong runtime
`@sentry/bun` neither installs nor exports `breadcrumbsIntegration`, so `notSupported: javascript.bun`
in `breadcrumbs.mdx` is correct. The inverse bug is real and unreported: the same file also lists
`javascript.deno`, while `packages/deno/src/sdk.ts:39` installs it and `index.ts:164` exports it.

### Two counts moved with `mastraIntegration` on develop
`getTracingIntegrations()` gained `mastraIntegration()` after the pin. Bun's default set is 43, not 42
(DOC-B2); Deno's is 40, not 39 (DOC-D2). Both need a Mastra row, or the counts pinned to `6f2da7483d`.

### X3 — one more missing row
The Cloudflare table is missing four rows, not three: `spanStreamingIntegration` as well as
`ConversationId`, `HttpServer` and `Console` (`packages/cloudflare/src/baseSdk.ts:51-72` plus
`server-runtime-client.ts:56`). Two existing rows are also wrong: `:8` should be
`eventFiltersIntegration`, and `:17` marks the removed `honoIntegration` auto-enabled.

## Line drift on master

Most of it comes from `ae4b46502` (#19208, dataCollection step) and `4baeabd4f` (#19241, guides
restructure).

- **DOC-B1 / DOC-Q4** Bun guide: `--preload` sentence `:88` (was `:94`), alert `:90-94` (was
  `:96-100`), command `:100` (was `:106`). `:20-22` and `:182` are still exact. The command already
  sat on `:100` at the re-check commit, so `:94`/`:106` were stale before the audit shipped.
- **DOC-D1 / DOC-D3** Deno guide: run commands `:100` and `:119` (were `:106`, `:125`).
- **DOC-B3 / DOC-D4** Hono guide: Bun code tab `:278-280` (was `:290-292`), Deno tab `:302-304` with
  `Deno.serve` at `:323` (was `:320-322`).
- **DOC-C1** `vercelai.mdx` entrypoint table `:66-71` inside the Cloudflare section `:60-73` (was
  `:61-77`).
- **DOC-C4** vite-plugin options `:150-166` (was `:138-154`); `wranglerConfigPath` now has its own
  correct entry at `:130-148`.
- **DOC-C5** `wrapRequestHandler` import `:219` (was `:221`); Hydrogen subpath `:187` (was `:188`).
- **DOC-C6** `features/workers-ai.mdx` → `agent-tracing/workers-ai.mdx` (`2e707563c`, #19279).
- **DOC-C7** TanStack imports `:80,137,206` (was `:80,143,219`); `tanstackstart-react/manual-setup/index.mdx:377` (was `:391`).
- **DOC-C8** Cloudflare `logs` block `:356-360` (was `:352`).
- **X2** `MIGRATION.md:282-288` at develop head (was `:289-295` at the pin).
- **MIGRATION.md, Cloudflare section** every citation is 8-10 lines low even at the pin: nodejs_compat
  `:1394-1399`, D1 `:1401-1416`, RPC `:1418-1431`, hono `:1445-1453`. At develop head: `:1600-1605`,
  `:1607-1622`, `:1624-1637`, `:1651-1659`.

Everything else sits on the exact cited lines, including all of DOC-B2, DOC-D2, DOC-D5, DOC-D6, X1,
DOC-Q5 and DOC-Q6.

## Grep results for the "no page mentions X" claims

| claim | hits on master |
| --- | --- |
| `@sentry/bun/plugin` / `sentryBunPlugin` (DOC-B1, X2) | 0 |
| `@sentry/deno/import` in the Deno guide (DOC-D1) | 0 |
| Bun runtime in express/fastify/koa/hapi/nextjs guides (DOC-B3) | 0 (7 nextjs hits are "Bunyan"/"bundle") |
| Deno in express/fastify/koa/hapi guides (DOC-D4) | 0 |
| `enableRpcTracePropagation` (DOC-C3) | 3, all legitimate (deprecated SdkOption + migration diff) |
| `cacheClient` (DOC-C3) | 0 |
| `durableObjectSqlSpanAllowlist` / `durableObjectStorageSpanAllowlist` (DOC-C3) | 0 / 0 |
| `enableOpenTelemetrySetup` (DOC-C3) | 6, all in the v11 migration page, no SdkOption entry |
| `enable_nodejs_http_server_modules` (X3) | 0 |
| Bun channel-injection warning strings (DOC-Q4) | 0 |
| `--require` on the Node getting-started page (DOC-Q5) | 0 |
| `browserTracingIntegration` in `@sentry/cloudflare` (DOC-C8) | 0 on master, pin and develop |

## SDK claims: pin vs develop head

Everything held at the pin. Four things changed at develop head:

1. `mastraIntegration()` added to `getTracingIntegrations()` (`server-utils/src/integrations/index.ts:51`) — bumps the Bun and Deno counts.
2. `instrumentEnv.ts` branches shifted and the commented-out rate-limit block was deleted (D1 `:64-68` → `:61-65`).
3. `packages/server-runtime-injection/src/register.ts` warning moved `:160` → `:201`.
4. `MIGRATION.md` shifted by ~200 lines.

Unchanged at develop head and worth keeping as the anchors: `packages/bun/src/plugin.ts:14`,
`packages/bun/src/sdk.ts:38-44` and `:47-79`, `packages/deno/src/sdk.ts:28-49`,
`packages/deno/src/client.ts:36`, `packages/deno/README.md:60-83`,
`packages/cloudflare/src/client.ts:324/360/384/409/451`, `packages/cloudflare/src/request.ts:13`,
`packages/cloudflare/src/vite/index.ts:12-55`, `packages/cloudflare/src/baseSdk.ts:51-72`,
`packages/cloudflare/src/instrumentations/worker/instrumentD1.ts:114-116/142-146/178`,
`packages/node/src/sdk/index.ts:126-133`, `.github/workflows/build.yml:522`.
