Grepping `docs/platforms/javascript/guides/hapi/` for "bun" returns nothing. That guide is `sdk: sentry.javascript.node` with `fallbackGuide: javascript.node` (`hapi/index.mdx:4-5`) and renders `getting-started-node` (`hapi/index.mdx:12`), while `platform-includes/getting-started-use/javascript.hapi.mdx:17,42` still instruct `await Sentry.setupHapiErrorHandler(server)` in both the CJS and the ESM tab. The Bun guide's alert at `guides/bun/index.mdx:90-94` is the only statement about bundling, and it is backwards for this combination.

Verified on `@hapi/hapi` 21.3.10 with `@sentry/bun` 10.67.0 (develop, 6f2da7483d) on Bun 1.4.0 and re-run on 1.4.2, driver `mysql`@2.18.1, `tracesSampleRate: 1.0`: install `@sentry/bun`, put `Sentry.init` in `instrument.ts` imported as the first line of `app.ts`, create the database connection at module scope and call `db.connect()`, `await server.start()`, then build with `Bun.build({ entrypoints: ['./app.ts'], outdir: './dist', target: 'bun', external: ['@sentry/*'], sourcemap: 'external', plugins: [sentryBunPlugin()] })` from `@sentry/bun/plugin` and run `bun dist/app.js`.

Works today:

- Unhandled route-handler errors. No `setupHapiErrorHandler` call is needed in the bundled build, because the handler registers itself from the orchestrion `@hapi/hapi` start and initialize channels; the export is deprecated on develop. This is a v11-wide change rather than a Bun finding: `common/migration/v10-to-v11/index.mdx:713-721` already states that Express, Fastify, Koa and Hapi errors are captured by their integrations.
- Route names `GET /users/{id}` with source `route`, plus a `router` child span; the child span is named `router /users/{id}` under the `stream` default and `router GET /users/{id}` under `traceLifecycle: 'static'`
- Per-request isolation across concurrent requests
- Incoming `sentry-trace`/`baggage` continuation
- Outgoing `fetch` spans with propagation headers
- `mysql`@2 database spans nested under the router span
- `Sentry.logger` log envelopes, in the bundled and unbundled runs alike

Known limits:

- Without the plugin build there is no Hapi instrumentation: URL-sourced names and no router or database spans. Handler errors are captured only if you also call `await Sentry.setupHapiErrorHandler(server)`; in the plugin build the handler registers itself and the extra call is idempotent, producing exactly one event.
- Hapi answers its own 500 body unchanged in every variant.

What to change:

- New page `docs/platforms/javascript/guides/bun/frameworks/hapi.mdx`: install, `instrument.ts` placement, the `build.ts` recipe, `bun run build.ts && bun dist/app.js`, and the capability list.
- Note on that page that the error handler registers itself from the `@hapi/hapi` start and initialize channels in the bundled build, that the `setupHapiErrorHandler` export is deprecated on develop, and that an extra call is idempotent — while `platform-includes/getting-started-use/javascript.hapi.mdx:17,42` still instructs it.
- `guides/bun/index.mdx:90-94`: rewrite the "Bundled Code Limitation" alert, as DOC-F1 and DOC-F4 also ask. This is the second cell that contradicts it.

---

_From the runtime docs audit of September 2026, item DOC-F6, see the [docs audit](https://github.com/JPeer264/sentry-repros/blob/issue-linear-runtime-improvements/_reports/docs-audit.html) in the runtime audit repository. Behavior verified on `getsentry/sentry-javascript` develop at `6f2da7483d` (package 10.67.0) against docs at `046ce5942`; citations re-checked on 2026-09-08 against docs `aebda0ee4` and develop `03aaf42455`, after a second verification pass over every item._
