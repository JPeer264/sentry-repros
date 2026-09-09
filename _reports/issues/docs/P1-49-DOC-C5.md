**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

**Note.** the honoIntegration page removal is also in Linear SDK-1482.

The "Don't have access to onRequest?" expandable at `guides/cloudflare/index.mdx:207-238` holds a snippet at `:217-232` that imports `@sentry/cloudflare` at `:219` and calls `Sentry.wrapRequestHandler` at `:230`. `guides/cloudflare/configuration/integrations/hono.mdx:14` says `honoIntegration` is "enabled by default", under a deprecation Alert at `:8-12`.

What was observed: on `develop`, `wrapRequestHandler` is defined in `packages/cloudflare/src/request.ts:13` and reachable only through the `@sentry/cloudflare/request` subpath; the package exposes `.`, `./request` and `./vite`, and the main entry exports only `_INTERNAL_wrapRequestHandler` (`packages/cloudflare/src/index.ts:117`). The Hydrogen pages already use the subpath (`frameworks/hydrogen-react-router.mdx:187`, with prose at `:175` and `:179`). `honoIntegration` is deprecated on the released line and removed per `MIGRATION.md:1445-1453`; the integrations page is guide-local, so nothing hides it. The package README carries the same main-entry import (`packages/cloudflare/README.md:88` and `:99`). These pages will be wrong when v11 ships.

What to change:

- Change the import at `guides/cloudflare/index.mdx:219` to `@sentry/cloudflare/request`.
- Delete `guides/cloudflare/configuration/integrations/hono.mdx`, which already carries a deprecation notice and needs removing rather than a second one.
- Replace the bare redirect in `guides/cloudflare/frameworks/hono.mdx` with the install step and the `app.use(sentry())` wiring.
- Fix the `wrapRequestHandler` import in the `@sentry/cloudflare` README.

---

_From the runtime docs audit of September 2026, item DOC-C5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
