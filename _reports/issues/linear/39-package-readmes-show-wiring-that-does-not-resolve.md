# Package READMEs show wiring that does not resolve

Milestone: XPlatform Functionality Gaps
Labels: JavaScript, Task
Priority: Low

`packages/deno/README.md:70` and `src/import.mjs:10` show `--import=@sentry/deno/import`, which Deno resolves as a file path and rejects with `Module not found`. `packages/cloudflare/README.md:88` and `:99` import `wrapRequestHandler` from the main entry, which develop no longer exports (`packages/cloudflare/src/index.ts:117` exports only `_INTERNAL_wrapRequestHandler`); it lives on `@sentry/cloudflare/request`.

**Work item.** Fix both READMEs in one PR.

**Evidence.** First-round probes D-HOOK, CF-EXPORTS, see the code-defects table in the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html). Runtime docs audit, September 2026, develop `6f2da7483d` (package 10.67.0).
