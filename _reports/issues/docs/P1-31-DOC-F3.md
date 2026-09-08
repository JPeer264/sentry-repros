No guide page pairs Express with Bun. `docs/platforms/javascript/guides/express/index.mdx:4-5` declares `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` and renders `getting-started-node` (`express/index.mdx:12`), whose only run shape is `node --import ./instrument.mjs app.mjs` (`platform-includes/getting-started-node/javascript.mdx:88,95`). The Bun guide teaches `bun --preload ./instrument.js app.js` (`guides/bun/index.mdx:100`) and names no framework. The pairing does exist elsewhere in the docs but never with instructions: 81 common integration pages list `javascript.express` and `javascript.bun` together in `supported:`, and `common/configuration/integrations/mysql2.mdx:30` states "This integration only works in the Node.js and Bun runtimes".

Verified on Express 4.22.1 with `@sentry/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0 and re-run on 1.4.2: install `@sentry/bun` instead of `@sentry/node`, plus the `mysql` driver, put `Sentry.init` in `instrument.ts` imported as the first line of `app.ts`, create the database connection at module scope, keep plain `app.listen(port)`, then build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`. The `external: ['@sentry/*']` entry is what lets the process-wide client from the unbundled `instrument.ts` and the injected channels inside the bundle agree on one client. It is specific to this app shape and must not be generalized to every Bun framework: the same flag is fatal for a Hono app (DOC-F1).

Works today:

- Unhandled route errors, one event, no `setupExpressErrorHandler` call needed
- Route names `GET /users/:id` with source `route`, plus middleware and handler child spans
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql` database spans
- `Sentry.logger` log envelopes

Known limits:

- Without the bundle, running `bun app.ts` or `bun --preload ./instrument.ts app.ts` gives URL-sourced transaction names, no middleware, handler or database spans, and no automatic error capture. The `node:http` server span and the `http.client` span for outgoing `fetch` still arrive, and so do logs, which is what makes the gap easy to miss.
- The SDK emits no warning about the missing instrumentation unless `debug: true` is set.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/express.mdx`: the `@sentry/bun` and `mysql` install, the `instrument.ts` + first-import placement, the `build.ts` recipe with its `external` entry and the warning not to reuse that entry for other frameworks, the `bun dist/app.js` run command, and the capability list above.
- Keep `Sentry.setupExpressErrorHandler(app)` documented on that page for the unbundled quick start: it is the only thing that captures errors there, with mechanism `auto.middleware.express` rather than `auto.http.express`, and it is harmless in the bundled build.
- State on that page that a missing instrumentation is silent without `debug: true`.

---

_From the runtime docs audit of September 2026, item DOC-F3, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
