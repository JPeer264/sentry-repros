**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

Four places document the `@sentry/cloudflare/nodejs_compat` entrypoint: the alert at `guides/cloudflare/index.mdx:63`, the whole of `guides/cloudflare/features/nodejs-compat.mdx`, `guides/cloudflare/configuration/integrations/prisma.mdx:8`, `platform-includes/configuration/integrations/javascript.cloudflare.mdx:19`, and the two-entrypoint table in `common/agent-tracing/vercelai.mdx:61-77`.

What was observed: on `develop`, `@sentry/cloudflare` exposes only `.`, `./request` and `./vite`; importing `@sentry/cloudflare/nodejs_compat` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The subpath still exists on the last released state. `MIGRATION.md:1384-1391` records the removal. These pages will be wrong when v11 ships.

What to change, in the v11 docs update:

- Delete `guides/cloudflare/features/nodejs-compat.mdx` and keep it available in the v10 version selector.
- Remove the alert at `guides/cloudflare/index.mdx:63`.
- Rewrite the Prisma note at `configuration/integrations/prisma.mdx:8` and the entrypoint table in `common/agent-tracing/vercelai.mdx:61-77` to describe the single `@sentry/cloudflare` entry.
- Change `platform-includes/configuration/integrations/javascript.cloudflare.mdx:19` accordingly.
- Make the `getting-started-config` include state that the `nodejs_compat` compatibility flag is required for all of it.

---

_From the runtime docs audit of September 2026, item DOC-C1, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
