**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

`guides/cloudflare/features/vite-plugin.mdx:150-166` documents `_experimental` (`:150-154`), `_experimental.autoInstrumentation` (default `false`, `:156-160`) and `_experimental.useDiagnosticsChannelInjection` (default `false`, `:162-166`), with the claim at `:164` that "When disabled or omitted, the plugin is a no-op". `guides/cloudflare/index.mdx:77-92` passes `useDiagnosticsChannelInjection: true`. The page carries an experimental Alert at `:8-11` and names only `mysql` as an instrumented package (`:15`, `:59`).

What was observed: `packages/cloudflare/src/vite/index.ts:12-55` defines `wranglerConfigPath` (`:23`), `buildTimeInstrumentation` (default `true`, `:37`) and `autoInstrumentation` (default `true`, `:54`); a grep of `packages/cloudflare/src` for `_experimental` and `useDiagnosticsChannelInjection` returns nothing. `buildTimeInstrumentation` injects `diagnostics_channel.tracingChannel` calls into bundled packages; `autoInstrumentation` wraps the Worker entry with `withSentry` and configured Durable Object, Workflow, Agent and WorkerEntrypoint classes, in both `vite build` and `vite dev`. The instrumented packages are the entries in `packages/server-utils/src/orchestrion/config/index.ts:50-80` (29 at `6f2da7483d`; `:51-81` and 30 at develop head, where Mastra was added). The new defaults are pinned by the `vite` and `vite-autoinstrument` integration suites. The page will be wrong when v11 ships.

What to change:

- Replace the two `_experimental` option blocks at `:150-166` with `buildTimeInstrumentation` and `autoInstrumentation`, with their real defaults and effects; keep the `wranglerConfigPath` entry at `:130-148`, which is already correct.
- Remove `useDiagnosticsChannelInjection` from the snippet at `guides/cloudflare/index.mdx:77-92`.
- List the instrumented packages.
- Move the page out of the experimental section and remove the experimental Alert at `:8-11`.

---

_From the runtime docs audit of September 2026, item DOC-C4, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
