Fresh has no guide: there is no `fresh` entry under `docs/platforms/javascript/guides/` and no Fresh hits in `docs/` or `platform-includes/`. The Bun guide (`guides/bun/index.mdx:1-214`) documents only the `--preload` flow and its alert at `guides/bun/index.mdx:96-100` gives no guidance for a Vite-built SSR bundle, `common/configuration/integrations/bunserver.mdx:18` claims errors are captured automatically, and `common/enriching-events/transaction-name/index.mdx:90-103` documents `updateSpanName` but never the name source.

Verified on Fresh 2 (`@fresh/core` 2.3.3) built with `deno task build` and served on Bun 1.4.0: keep `@sentry/bun` and the database driver out of the SSR bundle via `ssr.external` and `build.rollupOptions.external` in `vite.config.ts`, install `@sentry/bun` where Bun resolves it from the built server file, put `Sentry.init` in an instrument module loaded before `_fresh/server.js`, and create the `mysql2` pool at module scope.

Works today:

- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans with no build plugin
- `Sentry.logger` log envelopes
- Route names `GET /users/:id`, once a middleware registered before `app.fsRoutes()` renames the root span from `ctx.route` and sets `SENTRY_SEGMENT_NAME_SOURCE` to `route`

Known limits:

- Unhandled route and middleware errors are not captured automatically, because Fresh renders its own 500 before anything reaches `Bun.serve`; report them with `Sentry.captureException(ctx.error, { mechanism: { type: 'fresh._error', handled: false } })` from `routes/_error.tsx`.
- Browser-side capture was not exercised.

What to change:

- New page `docs/platforms/javascript/guides/fresh/index.mdx` with `fallbackGuide: javascript.bun`, the build and externals config, the error route, the naming middleware and the capability list.
- `common/configuration/integrations/bunserver.mdx:18`: qualify the automatic error capture claim.
- `common/enriching-events/transaction-name/index.mdx:90-103`: document setting the segment name source to `route`.

---

_From the runtime docs audit of September 2026, item DOC-F8, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
