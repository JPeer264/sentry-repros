`docs/platforms/javascript/common/configuration/integrations/trpc.mdx:24` lists `javascript.deno` under `supported`, so the tRPC page renders on the Deno guide and instructs the reader to call `Sentry.trpcMiddleware`. The page's alert at `:32` repeats the claim in prose: "This integration only works inside server environments (Node.js, Bun, Deno)".

On develop, `trpcMiddleware` appears nowhere in `packages/deno/src`. The Deno entry point re-exports only `wrapMcpServerWithSentry` from `@sentry/core/server` (`packages/deno/src/index.ts:104`), with `instrumentPostgresJsSql` now coming from `@sentry/server-utils` at `:105`; at the pin both names were on `:104`. Either way `Sentry.trpcMiddleware` is `undefined` for a Deno user following the page. The two neighbouring runtimes do export it — `packages/bun/src/index.ts:156` on develop (`:154` at the pin) and `packages/cloudflare/src/index.ts:109` — and their entries in the same list are accurate, though the alert never names Cloudflare.

What to change:

- Delete the `- javascript.deno` line from the `supported` frontmatter in `trpc.mdx`.
- Fix the alert at `:32` in the same edit: drop Deno from the runtime list and add Cloudflare, otherwise the page keeps the wrong claim in prose.
- Keep `javascript.bun` and `javascript.cloudflare`, which match the shipped exports.

---

_From the runtime docs audit of September 2026, item DOC-R5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
