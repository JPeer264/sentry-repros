The guides promise named transactions from the base setup: `getting-started-node/javascript.mdx:120`, `guides/bun/index.mdx:188`, `guides/deno/index.mdx:207`, `guides/cloudflare/index.mdx:364`. None says where a route name comes from.

Observed on develop with the base setup: a plain `node:http` server on Node names every segment span `GET`; `Deno.serve` names every span `GET` with source `url`, a `URLPattern` route included; `withSentry` on Workers names every span `GET` with source `url`; only `Bun.serve` with a `routes` map produces `GET /users/:id` with source `route`. On Bun and Cloudflare the error event carries no `transaction` field at all, so an issue shows no route either. Route names appear once a framework integration is in place, as the framework matrix records.

What to change:

- On each guide, state that the base setup names server spans by method (or URL under the static lifecycle) and that route names come from a framework integration, or on Bun from the `Bun.serve` routes map.
- Link the framework pages for the runtime from that sentence.
- On the Bun and Cloudflare guides, drop the claim that issues are grouped by transaction until the SDK sets the field.

---

_From the runtime docs audit of September 2026, item DOC-Q3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
