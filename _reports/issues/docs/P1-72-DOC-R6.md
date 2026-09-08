Thirteen integration pages under `docs/platforms/javascript/common/configuration/integrations/` gate themselves to a `supported` allowlist that includes `javascript.bun` but not `javascript.deno`: `mysql.mdx:24`, `mysql2.mdx:24`, `postgres.mdx:24`, `redis.mdx:24`, `mongo.mdx:24`, `graphql.mdx:24`, `mongoose.mdx:23`, `knex.mdx:23`, `dataloader.mdx:23`, `kafka.mdx:23`, `genericpool.mdx:23`, `prisma.mdx:23` and `firebase.mdx:9`. All thirteen are invisible on the Deno guide.

On develop, `packages/deno/src/index.ts:118-144` re-exports twelve of these integrations from `@sentry/server-utils`, and `packages/deno/src/sdk.ts:48` spreads `getTracingIntegrations()` (`packages/server-utils/src/integrations/index.ts:31-56`), which installs all thirteen — prisma included — in the Deno default set. Prisma is the one that is on by default without being re-exported from `@sentry/deno`.

What to change:

- Add `- javascript.deno` to the `supported` list on all thirteen pages.
- On `prisma.mdx`, state that Deno installs it by default but does not re-export it individually.

---

_From the runtime docs audit of September 2026, item DOC-R6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
