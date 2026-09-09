Thirteen integration pages under `docs/platforms/javascript/common/configuration/integrations/` gate themselves to a `supported` allowlist that includes `javascript.bun` but not `javascript.deno`: `mysql.mdx:24`, `mysql2.mdx:24`, `postgres.mdx:24`, `redis.mdx:24`, `mongo.mdx:24`, `graphql.mdx:24`, `mongoose.mdx:23`, `knex.mdx:23`, `dataloader.mdx:23`, `kafka.mdx:23`, `genericpool.mdx:23`, `prisma.mdx:23` and `firebase.mdx:9`. All thirteen are invisible on the Deno guide.

On develop, `packages/deno/src/index.ts:119-147` (`:118-144` at the pin) re-exports twelve of these integrations from `@sentry/server-utils`, so all thirteen are usable on Deno. `packages/deno/src/sdk.ts:48` spreads `getTracingIntegrations()` (`packages/server-utils/src/integrations/index.ts:31-58` on develop, `:31-56` at the pin), which installs eleven of them by default: graphql, mongo, mongoose, mysql, mysql2, redis, postgres, prisma, genericPool, kafka and firebase. `dataloaderIntegration` and `knexIntegration` are re-exported but opt-in — the user adds them to `integrations`, on Deno exactly as on Node — which the comment at `packages/deno/src/index.ts:114-117` states in prose. Prisma is the one that is on by default without being re-exported from `@sentry/deno`.

Twelve of the thirteen pages also carry an alert reading "This integration only works in the Node.js and Bun runtimes" (`mysql.mdx:30`, `knex.mdx:29`, `dataloader.mdx:29`, `prisma.mdx:29` and so on); `firebase.mdx` is the one without an alert.

What to change:

- Add `- javascript.deno` to the `supported` list on all thirteen pages.
- Rewrite the "This integration only works in the Node.js and Bun runtimes" alert on the twelve pages that carry it, so the prose matches the platform keys; adding the key alone moves the wrong claim onto the Deno guide.
- On `knex.mdx` and `dataloader.mdx`, state that the integration is opt-in on Deno as on Node: it is importable from `@sentry/deno` but not in the default set.
- On `prisma.mdx`, state that Deno installs it by default but does not re-export it individually.

---

_From the runtime docs audit of September 2026, item DOC-R6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
