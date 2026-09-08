No page joins Koa and Bun. `docs/platforms/javascript/guides/koa/index.mdx:4-5` declares `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and includes `getting-started-node` (`koa/index.mdx:12`), whose run command is `node --import ./instrument.mjs app.mjs` (`platform-includes/getting-started-node/javascript.mdx:95`). The Bun guide stops at `bun --preload ./instrument.js app.js` (`guides/bun/index.mdx:106`).

Verified on Koa 2.16.4 with `@koa/router` 12.0.2 and `@sentry/bun` 10.67.0 on Bun 1.4.0: install `@sentry/bun` instead of `@sentry/node`, put `Sentry.init` in `instrument.ts` imported as the first line of `app.ts`, create the database connection at module scope, then build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`.

Works today:

- Unhandled handler errors, with no `Sentry.setupKoaErrorHandler(app)` call needed
- Route names `GET /users/:id` with source `route`, plus a `router` child span
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql` database spans nested under the router span
- `Sentry.logger` log envelopes, in the bundled and unbundled runs alike

Known limits:

- Without the plugin build, Koa is uninstrumented on Bun: URL-sourced transaction names, no router or database spans, and handler errors are never captured.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/koa.mdx`: the `@sentry/bun` install, `instrument.ts` placement, the `build.ts` recipe, `bun run build.ts && bun dist/app.js`, and the capability list.

---

_From the runtime docs audit of September 2026, item DOC-F5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
