**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

`enableRpcTracePropagation` appears in `platform-includes/distributed-tracing/how-to-use/javascript.cloudflare.mdx:11,26,57,66`, `guides/cloudflare/features/agents-sdk.mdx:29` and `common/agent-tracing/openai.mdx:107`. Neither it nor `rpcTracePropagationBindings` has an `SdkOption` entry in `common/configuration/options.mdx`; `cacheClient`, `enableOpenTelemetrySetup`, `durableObjectSqlSpanAllowlist` and `durableObjectStorageSpanAllowlist` are missing there too.

What was observed: `packages/cloudflare/src/client.ts:359` defines `rpcTracePropagationBindings`, typed as `TracePropagationTargets`, accepting binding names and regexes (for example `['ORDERS', /^SVC_/]`). A grep of `packages/cloudflare/src` for `enableRpcTracePropagation` returns nothing. `MIGRATION.md:1410-1428` documents the replacement and its matching rules. The three pages above will be wrong when v11 ships.

What to change, in the v11 docs update:

- Replace the `enableRpcTracePropagation` mentions in the three files above with `rpcTracePropagationBindings`, including the matching rules from `MIGRATION.md:1410-1428`.
- Add `SdkOption` entries to `common/configuration/options.mdx` for `rpcTracePropagationBindings`, `cacheClient`, `enableOpenTelemetrySetup`, `durableObjectSqlSpanAllowlist` and `durableObjectStorageSpanAllowlist`.

---

_From the runtime docs audit of September 2026, item DOC-C3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
