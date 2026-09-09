**Filed.** Must item of Linear [SDK-1426](https://linear.app/getsentry/issue/SDK-1426), "Cloudflare (Getting started / Manual setup)".

**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

Five places document the `@sentry/cloudflare/nodejs_compat` entrypoint: the alert at `guides/cloudflare/index.mdx:63`, the whole of `guides/cloudflare/features/nodejs-compat.mdx` (50 lines, the entrypoint at `:6` and `:10`), `guides/cloudflare/configuration/integrations/prisma.mdx:8`, `platform-includes/configuration/integrations/javascript.cloudflare.mdx:19`, and the two-entrypoint table in `common/agent-tracing/vercelai.mdx:66-71`, inside the Cloudflare section at `:60-73`.

What was observed: on `develop`, `@sentry/cloudflare` exposes only `.`, `./request` and `./vite`; importing `@sentry/cloudflare/nodejs_compat` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The subpath still exists on the last released state. `MIGRATION.md:1394-1399` records the removal (`:1600-1605` at develop head), and `common/migration/v10-to-v11/index.mdx:948-959` already carries the migration half for upgraders. These five pages will be wrong when v11 ships.

What to change, in the v11 docs update:

- Delete `guides/cloudflare/features/nodejs-compat.mdx` and keep it available in the v10 version selector.
- Remove the alert at `guides/cloudflare/index.mdx:63`.
- Rewrite the Prisma note at `configuration/integrations/prisma.mdx:8` and the entrypoint table in `common/agent-tracing/vercelai.mdx:66-71` to describe the single `@sentry/cloudflare` entry.
- Change `platform-includes/configuration/integrations/javascript.cloudflare.mdx:19` accordingly.

---

_From the runtime docs audit of September 2026, item DOC-C1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
