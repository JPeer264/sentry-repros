**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

Four `@sentry/cloudflare` options have no `SdkOption` entry in `common/configuration/options.mdx`: `cacheClient`, `enableOpenTelemetrySetup`, `durableObjectSqlSpanAllowlist` and `durableObjectStorageSpanAllowlist`. Three of them appear nowhere in `docs/` or `platform-includes/`; `enableOpenTelemetrySetup` appears six times, all inside `common/migration/v10-to-v11/index.mdx`, none of them an options entry.

What was observed: the SDK declares all four in `packages/cloudflare/src/client.ts` - `enableOpenTelemetrySetup` at `:324`, `durableObjectSqlSpanAllowlist` at `:384`, `durableObjectStorageSpanAllowlist` at `:409` and `cacheClient` at `:451`, on the same lines at `6f2da7483d` and at develop head. `rpcTracePropagationBindings` is declared at `:360` and now has its own entry at `options.mdx:580-592`; the deprecated `enableRpcTracePropagation` entry at `options.mdx:594-600` documents an option v11 removes (`MIGRATION.md:1418-1431`, `:1624-1637` at develop head).

What to change:

- Add `SdkOption` entries to `common/configuration/options.mdx` for `cacheClient`, `enableOpenTelemetrySetup`, `durableObjectSqlSpanAllowlist` and `durableObjectStorageSpanAllowlist`.
- In the v11 docs update, remove the deprecated `enableRpcTracePropagation` block at `common/configuration/options.mdx:594-600`; the `rpcTracePropagationBindings` entry at `:580-592` replaces it.

---

_From the runtime docs audit of September 2026, item DOC-C3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
