`guides/cloudflare/index.mdx:240` introduces source maps as an optional improvement. The verify step at `:267-280` says the thrown error produces an issue, with no word on what the stack trace looks like; the Pages variant at `:297-301` has the same problem.

Observed on develop under `wrangler dev`: the error event arrives with `hasContextLine: false`, every frame in `.wrangler/tmp/dev-*/index.js`, and no runtime version. The same app on Node, Bun and Deno ships context lines and source paths. The segment span of the throwing route also reports status `ok` although the Worker answered 500 (SDK-side, tracked separately).

What to change:

- Move the source maps step before the verify step, or state in both verify snippets (`:267-280` for Workers, `:297-301` for Pages) that the first issue shows bundle frames without source lines until source maps are uploaded.
- Show what the issue looks like without source maps, so the reader does not take it for a broken setup.

---

_From the runtime docs audit of September 2026, item DOC-Q6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
