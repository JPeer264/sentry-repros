No page joins Koa and Bun. `docs/platforms/javascript/guides/koa/index.mdx:4-5` declares `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and includes `getting-started-node` (`koa/index.mdx:12`), whose run command is `node --import ./instrument.mjs app.mjs` (`platform-includes/getting-started-node/javascript.mdx:95`). The Bun guide stops at `bun --preload ./instrument.js app.js` (`guides/bun/index.mdx:100`) and its "Bundled Code Limitation" alert at `guides/bun/index.mdx:90-94` steers Bun users away from the only setup that works here.

Verified on Koa 2.16.4 with `@koa/router` 12.0.2 and `@sentry/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0 and re-run on 1.4.2, driver `mysql`@2.18.1, `tracesSampleRate: 1.0`: install `@sentry/bun` instead of `@sentry/node`, put `Sentry.init` in `instrument.ts` imported as the first line of `app.ts`, create the database connection at module scope, then build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`. The capabilities below were exercised under `traceLifecycle: 'static'`; `stream` is the default on this line and changes span names (`db SELECT users` and `http.client GET 127.0.0.1` where static gives `db SELECT id, name FROM users` and `http.client GET http://127.0.0.1:.../downstream`).

Works today:

- Unhandled handler errors. No `Sentry.setupKoaErrorHandler(app)` call is needed, but that is a v11-wide change rather than a Bun finding: on v11 Express, Fastify, Koa and Hapi errors are captured by their integrations (`common/migration/v10-to-v11/index.mdx:713-721`), while `platform-includes/getting-started-use/javascript.koa.mdx:11,28` still presents the call as required.
- Route names `GET /users/:id` with source `route`, plus a `router` child span
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql`@2 database spans nested under the router span, with the connection created at module scope
- `Sentry.logger` log envelopes, in the bundled and unbundled runs alike

Known limits:

- Without the plugin build, Koa is uninstrumented on Bun: URL-sourced transaction names, no router or database spans, and handler errors are never captured.
- The failure is silent. The SDK emits no warning unless `debug: true` is set, so a Bun and Koa user following the Bun guide gets transactions and logs and believes the setup works while every route error is dropped.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/koa.mdx`: the `@sentry/bun` install, `instrument.ts` placement, the `build.ts` recipe, `bun run build.ts && bun dist/app.js`, and the capability list.
- `guides/bun/index.mdx:90-94`: rewrite the "Bundled Code Limitation" alert. This cell is one of four that contradict it, and the new Koa page is unreachable advice while it stands.
- `platform-includes/getting-started-use/javascript.koa.mdx:11,28`: drop the `Sentry.setupKoaErrorHandler(app)` instruction, which the v10-to-v11 migration guide already supersedes.

---

_From the runtime docs audit of September 2026, item DOC-F5, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
