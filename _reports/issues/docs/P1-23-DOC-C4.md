**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

`guides/cloudflare/features/vite-plugin.mdx:138-154` documents `_experimental.autoInstrumentation` (default `false`) and `_experimental.useDiagnosticsChannelInjection` (default `false`), with the claim that "When disabled or omitted, the plugin is a no-op". `guides/cloudflare/index.mdx:77-92` passes `useDiagnosticsChannelInjection: true`. The page names only `mysql` as an instrumented package.

What was observed: `packages/cloudflare/src/vite/index.ts:12-55` defines `wranglerConfigPath`, `buildTimeInstrumentation` (default `true`) and `autoInstrumentation` (default `true`); a grep of `packages/cloudflare/src` for `_experimental` and `useDiagnosticsChannelInjection` returns nothing. `buildTimeInstrumentation` injects `diagnostics_channel.tracingChannel` calls into bundled packages; `autoInstrumentation` wraps the Worker entry with `withSentry` and configured Durable Object, Workflow, Agent and WorkerEntrypoint classes, in both `vite build` and `vite dev`. The instrumented packages are the entries in `packages/server-utils/src/orchestrion/config/index.ts:49-79`. The new defaults are pinned by the `vite` and `vite-autoinstrument` integration suites. The page will be wrong when v11 ships.

What to change:

- Replace the options block at `:138-154` with `wranglerConfigPath`, `buildTimeInstrumentation` and `autoInstrumentation`, with their real defaults and effects.
- Remove `useDiagnosticsChannelInjection` from the snippet at `guides/cloudflare/index.mdx:77-92`.
- List the instrumented packages.
- Move the page out of the experimental section.

---

_From the runtime docs audit of September 2026, item DOC-C4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
