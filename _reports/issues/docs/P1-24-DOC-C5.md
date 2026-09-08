**Note.** v11-gated; file as a sub-issue of Linear SDK-1296.

`guides/cloudflare/index.mdx:212-231` imports `@sentry/cloudflare` and calls `Sentry.wrapRequestHandler`. `guides/cloudflare/configuration/integrations/hono.mdx:14` says `honoIntegration` is "enabled by default".

What was observed: on `develop`, `wrapRequestHandler` is defined in `packages/cloudflare/src/request.ts:13` and reachable only through the `@sentry/cloudflare/request` subpath; the package exposes `.`, `./request` and `./vite`, and the main entry exports only `_INTERNAL_wrapRequestHandler`. The Hydrogen pages already use the subpath (`frameworks/hydrogen-react-router.mdx:188`). `honoIntegration` is deprecated on the released line and removed per `MIGRATION.md:1436-1445`; the integrations page is guide-local, so nothing hides it. The package README carries the same main-entry import. These pages will be wrong when v11 ships.

What to change:

- Change the import at `guides/cloudflare/index.mdx:221` to `@sentry/cloudflare/request`.
- Delete `guides/cloudflare/configuration/integrations/hono.mdx`.
- Replace the bare redirect in `guides/cloudflare/frameworks/hono.mdx` with the install step and the `app.use(sentry())` wiring.
- Fix the `wrapRequestHandler` import in the `@sentry/cloudflare` README.

---

_From the runtime docs audit of September 2026, item DOC-C5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
