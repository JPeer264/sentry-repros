No page mentions Express and Bun together. `docs/platforms/javascript/guides/express/index.mdx:4-5` declares `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and renders `getting-started-node` (`express/index.mdx:12`), whose only run shape is `node --import ./instrument.mjs app.mjs` (`platform-includes/getting-started-node/javascript.mdx:88,95`). The Bun guide teaches `bun --preload ./instrument.js app.js` (`guides/bun/index.mdx:106`) and names no framework.

Verified on Express 4.22.1 with `@sentry/bun` 10.67.0 on Bun 1.4.0: install `@sentry/bun` instead of `@sentry/node`, put `Sentry.init` in `instrument.ts` imported as the first line of `app.ts`, create the database connection at module scope, keep plain `app.listen(port)`, then build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`.

Works today:

- Unhandled route errors, one event, no `setupExpressErrorHandler` call needed
- Route names `GET /users/:id` with source `route`, plus middleware and handler child spans
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql` database spans
- `Sentry.logger` log envelopes

Known limits:

- Without the bundle, running `bun app.ts` or `bun --preload ./instrument.ts app.ts` gives URL-sourced transaction names, no middleware, handler or database spans, and no automatic error capture.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/express.mdx`: the `@sentry/bun` install, the `instrument.ts` + first-import placement, the `build.ts` recipe, the `bun dist/app.js` run command, and the capability list above.

---

_From the runtime docs audit of September 2026, item DOC-F3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-07 against docs `b568ebbd3` and develop `d6426ad581`._
