Fresh has no guide: there is no `fresh` entry under `docs/platforms/javascript/guides/` and no page in `docs/` or `platform-includes/` mentions the Fresh framework. The Bun guide (`guides/bun/index.mdx:1-212`) documents only the `--preload` flow and its alert at `guides/bun/index.mdx:90-94` gives no guidance for a Vite-built SSR bundle, `common/configuration/integrations/bunserver.mdx:18` claims errors are captured automatically, and `common/enriching-events/transaction-name/index.mdx:90-103` documents `Sentry.updateSpanName` (at `:100`) but never the name source. `sentry.segment.name.source` appears in the docs only in the v10-to-v11 migration guide, at `:594`.

Verified on Fresh 2 (`@fresh/core` 2.3.3) built with `deno task build` and served on Bun 1.4.0: keep `@sentry/bun` and the database driver out of the SSR bundle with `ssr.external: ['@sentry/bun', 'mysql2', 'mysql2/promise']` and `build.rollupOptions.external: [/^@sentry\//, /^mysql2/]` in `vite.config.ts`, and install those packages one directory above the Fresh app, because the app directory's `node_modules` is Deno-managed (`nodeModulesDir: "manual"`). Then add an `entry.ts` next to the build output and start it with `bun entry.ts`: `import './instrument.ts'; import server from './app/_fresh/server.js'; Bun.serve({ port, fetch: req => server.fetch(req) });`. That mount is what makes the SDK see requests at all. Create the `mysql2` pool at module scope in the instrument module.

Works today:

- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql2` database spans with no build plugin
- `Sentry.logger` log envelopes
- Route names `GET /users/:id` with source `route`, once a middleware registered before `app.fsRoutes()` renames the root span from `ctx.route` and sets the `sentry.segment.name.source` attribute to `route`. `updateSpanName` alone leaves the source as `custom`, and `setAttribute('sentry.source', 'route')` is the v10 key and is ignored on v11

Known limits:

- Unhandled route and middleware errors are not captured automatically, because Fresh renders its own 500 before anything reaches `Bun.serve`. The request span is still sent with status `internal_error`, so the reader sees a failing transaction and no event. Report the error from one of three equivalent hooks: `Sentry.captureException(ctx.error, { mechanism: { type: 'fresh._error', handled: false } })` in `routes/_error.tsx`; `app.onError('*', ...)` in `main.ts`, which needs no try/catch and re-throw; or a middleware registered before every other `app.use`. Do not rely on `captureConsoleIntegration`: it captures only while Fresh's built-in error page is in use and stops entirely once `_error.tsx` or `onError` exists.
- The plugin build is not an alternative here. Fresh compiles the whole framework into `server-entry.js` and its `App` hard-codes the error hook to a no-op, so a `Bun.build` with `sentryBunPlugin()` does not change this, unlike the Bun framework pages that present that build as the fix.
- Fresh's own OpenTelemetry spans never reach Sentry: every transaction arrived with `spans: []` apart from the ones the SDK created.
- Browser-side capture was not exercised, and `/assets/*` static-file serving, which still calls `Deno.stat` and `Deno.open`, was not exercised under Bun.

What to change:

- New page `docs/platforms/javascript/guides/fresh/index.mdx` with the build and externals config, the `entry.ts` mount and `bun entry.ts`, the node_modules placement rule, the error hook, the naming middleware and the capability list. Which `fallbackGuide` it takes is a scoping decision this run does not settle, since Fresh was also probed on Deno and on Cloudflare.
- `common/configuration/integrations/bunserver.mdx:18`: qualify the automatic error capture claim.
- `common/enriching-events/transaction-name/index.mdx:90-103`: document that `sentry.segment.name.source` is the v11 attribute for the name source and that the v10 `sentry.source` key is ignored.

---

_From the runtime docs audit of September 2026, item DOC-F8, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
