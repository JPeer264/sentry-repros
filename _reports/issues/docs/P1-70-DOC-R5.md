`docs/platforms/javascript/common/configuration/integrations/trpc.mdx:24` lists `javascript.deno` under `supported`, so the tRPC page renders on the Deno guide and instructs the reader to call `Sentry.trpcMiddleware`.

On develop, `trpcMiddleware` appears nowhere in `packages/deno/src`. The Deno entry point re-exports only `instrumentPostgresJsSql` and `wrapMcpServerWithSentry` from `@sentry/core/server` (`packages/deno/src/index.ts:104`), so `Sentry.trpcMiddleware` is `undefined` for a Deno user following the page. The two neighbouring runtimes do export it — `packages/bun/src/index.ts:154` and `packages/cloudflare/src/index.ts:109` — and their entries in the same list are accurate.

**What to change**

- Delete the `- javascript.deno` line from the `supported` frontmatter in `trpc.mdx`.
- Keep `javascript.bun` and `javascript.cloudflare`, which match the shipped exports.

---

_From the runtime docs audit of September 2026, item DOC-R5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
